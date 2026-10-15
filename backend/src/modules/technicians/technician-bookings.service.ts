import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TechnicianBooking } from './entities/technician-booking.entity.js';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { TechnicianCategory } from './entities/technician-category.entity.js';
import { TechnicianServiceCatalogItem } from './entities/technician-service-catalog-item.entity.js';
import { TechnicianProviderService } from './entities/technician-provider-service.entity.js';
import { SystemSetting } from '../settings/entities/system-setting.entity.js';
import { CreateTechnicianBookingDto } from './dto/create-technician-booking.dto.js';
import { SubmitQuotationDto } from './dto/submit-quotation.dto.js';
import { AcceptQuotationDto } from './dto/accept-quotation.dto.js';
import { QueryTechnicianBookingsDto } from './dto/query-technician-bookings.dto.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';
import {
  TechnicianBookingType,
  TechnicianBookingStatus,
  QuotationStatus,
  PaymentStatus,
} from '../../common/enums/index.js';

@Injectable()
export class TechnicianBookingsService {
  private readonly logger = new Logger(TechnicianBookingsService.name);

  constructor(
    @InjectRepository(TechnicianBooking)
    private readonly bookingRepo: Repository<TechnicianBooking>,
    @InjectRepository(TechnicianProfile)
    private readonly techProfileRepo: Repository<TechnicianProfile>,
    @InjectRepository(TechnicianCategory)
    private readonly categoryRepo: Repository<TechnicianCategory>,
    @InjectRepository(TechnicianServiceCatalogItem)
    private readonly serviceItemRepo: Repository<TechnicianServiceCatalogItem>,
    @InjectRepository(TechnicianProviderService)
    private readonly providerServiceRepo: Repository<TechnicianProviderService>,
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
    private readonly dataSource: DataSource,
  ) {}

  private generateBookingNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TECH-${dateStr}-${randomHex}`;
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async getCommissionPercentage(): Promise<number> {
    const setting = await this.settingRepo.findOne({
      where: { key: 'TECHNICIAN_COMMISSION_PERCENTAGE' },
    });
    if (setting && setting.value) {
      const parsed = parseFloat(setting.value);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return 20.0;
  }

  // ==================== 1. CREATE BOOKING ====================

  async createBooking(
    userId: string,
    dto: CreateTechnicianBookingDto,
  ): Promise<TechnicianBooking> {
    const bookingNumber = this.generateBookingNumber();
    const startOtp = this.generateOtp();
    const completionOtp = this.generateOtp();
    const adminCommissionPercentage = await this.getCommissionPercentage();

    return this.dataSource.transaction(async (manager) => {
      let quotedAmount = 0.0;
      let advanceAmount = 0.0;
      let remainingAmount = 0.0;
      let quotationStatus = QuotationStatus.NOT_REQUIRED;
      let status = TechnicianBookingStatus.REQUESTED;
      let advancePaymentStatus = PaymentStatus.PENDING;

      let category: TechnicianCategory | null = null;
      let serviceCatalogItem: TechnicianServiceCatalogItem | null = null;
      let providerService: TechnicianProviderService | null = null;
      let technicianProfileId = dto.technicianProfileId || null;

      if (dto.categoryId) {
        category = await manager.findOne(TechnicianCategory, {
          where: { id: dto.categoryId },
        });
      }

      if (dto.serviceCatalogItemId) {
        serviceCatalogItem = await manager.findOne(TechnicianServiceCatalogItem, {
          where: { id: dto.serviceCatalogItemId },
          relations: { category: true },
        });
        if (serviceCatalogItem && !category) {
          category = serviceCatalogItem.category;
        }
      }

      // Check if this is Flow B (Custom Inspection / Quote Required)
      const isCustomInspection =
        dto.bookingType === TechnicianBookingType.CUSTOM_INSPECTION ||
        category?.isOther === true;

      // ----------------- FLOW A: KNOWN FIXED SERVICE -----------------
      if (!isCustomInspection) {
        if (dto.providerServiceId) {
          providerService = await manager.findOne(TechnicianProviderService, {
            where: { id: dto.providerServiceId },
            relations: { technicianProfile: true },
          });
          if (providerService) {
            technicianProfileId = providerService.technicianProfileId;
            quotedAmount = providerService.customPrice;
          }
        } else if (technicianProfileId && dto.categoryId) {
          providerService = await manager.findOne(TechnicianProviderService, {
            where: {
              technicianProfileId,
              categoryId: dto.categoryId,
            },
          });
          if (providerService && providerService.customPrice > 0) {
            quotedAmount = providerService.customPrice;
          }
        }

        if (quotedAmount <= 0) {
          quotedAmount = category && category.basePrice > 0 ? category.basePrice : 450.0;
        }

        advanceAmount = Number(
          ((quotedAmount * adminCommissionPercentage) / 100).toFixed(2),
        );
        remainingAmount = Number((quotedAmount - advanceAmount).toFixed(2));
        quotationStatus = QuotationStatus.NOT_REQUIRED;

        const txId = dto.paymentTransactionId || (dto as any).advancePaymentTransactionId;
        // If user already authorized advance payment at checkout via Razorpay
        if (txId) {
          advancePaymentStatus = PaymentStatus.COMPLETED;
          status = TechnicianBookingStatus.CONFIRMED;
        } else {
          status = TechnicianBookingStatus.REQUESTED;
        }
      }

      // ----------------- FLOW B: UNKNOWN / OTHER / INSPECTION (QUOTATION) -----------------
      else {
        // Unknown issue / inspection: price is not yet known until mechanic quotes
        quotedAmount = 0.0;
        advanceAmount = 0.0;
        remainingAmount = 0.0;
        quotationStatus = QuotationStatus.PENDING_QUOTE;
        status = TechnicianBookingStatus.REQUESTED;
        advancePaymentStatus = PaymentStatus.PENDING;
      }

      const booking = manager.create(TechnicianBooking, {
        bookingNumber,
        userId,
        technicianProfileId,
        bookingType: dto.bookingType,
        status,
        categoryId: category ? category.id : null,
        serviceCatalogItemId: serviceCatalogItem ? serviceCatalogItem.id : null,
        providerServiceId: providerService ? providerService.id : null,
        breakdownLocation: dto.breakdownLocation,
        breakdownLat: dto.breakdownLat,
        breakdownLng: dto.breakdownLng,
        landmark: dto.landmark || null,
        vehicleMakeModel: dto.vehicleMakeModel || null,
        vehiclePlateNumber: dto.vehiclePlateNumber || null,
        vehicleType: dto.vehicleType || 'Car',
        issueDescription: dto.issueDescription || null,
        symptoms: dto.symptoms || [],
        mediaUrls: dto.mediaUrls || [],
        quotedAmount,
        quotationNotes: null,
        quotationSubmittedAt: null,
        quotationAcceptedAt: null,
        quotationStatus,
        adminCommissionPercentage,
        advanceAmount,
        remainingAmount,
        advancePaymentStatus,
        advancePaymentMethod: dto.paymentMethod || 'UPI',
        advancePaymentTransactionId: dto.paymentTransactionId || null,
        remainingPaymentStatus: PaymentStatus.PENDING,
        startOtp,
        completionOtp,
        customerNotes: dto.customerNotes || null,
      });

      return manager.save(booking);
    });
  }

  // ==================== 2. PROVIDER ACCEPTS REQUEST ====================

  async acceptRequest(
    bookingId: string,
    technicianUserId: string,
  ): Promise<TechnicianBooking> {
    const profile = await this.techProfileRepo.findOne({
      where: { userId: technicianUserId },
    });
    if (!profile) {
      throw new ForbiddenException('Only verified technicians can accept jobs');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking not found with ID ${bookingId}`);
    }

    if (
      booking.status !== TechnicianBookingStatus.REQUESTED &&
      booking.status !== TechnicianBookingStatus.SEARCHING
    ) {
      throw new BadRequestException(
        `Cannot accept booking with current status: ${booking.status}`,
      );
    }

    booking.technicianProfileId = profile.id;
    booking.status = TechnicianBookingStatus.ACCEPTED;
    return this.bookingRepo.save(booking);
  }

  // ==================== 3. PROVIDER SUBMITS QUOTATION (FLOW B) ====================

  async submitQuotation(
    bookingId: string,
    technicianUserId: string,
    dto: SubmitQuotationDto,
  ): Promise<TechnicianBooking> {
    const profile = await this.techProfileRepo.findOne({
      where: { userId: technicianUserId },
    });
    if (!profile) {
      throw new ForbiddenException('Only verified technicians can submit quotes');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking not found with ID ${bookingId}`);
    }

    if (booking.technicianProfileId && booking.technicianProfileId !== profile.id) {
      throw new ForbiddenException('You are not assigned to this booking');
    }

    const adminCommissionPercentage = await this.getCommissionPercentage();
    const quotedAmount = Number(dto.quotedAmount);
    const advanceAmount = Number(
      ((quotedAmount * adminCommissionPercentage) / 100).toFixed(2),
    );
    const remainingAmount = Number((quotedAmount - advanceAmount).toFixed(2));

    booking.technicianProfileId = profile.id;
    booking.quotedAmount = quotedAmount;
    booking.quotationNotes = dto.quotationNotes;
    booking.technicianNotes = dto.technicianNotes || booking.technicianNotes;
    booking.adminCommissionPercentage = adminCommissionPercentage;
    booking.advanceAmount = advanceAmount;
    booking.remainingAmount = remainingAmount;
    booking.quotationSubmittedAt = new Date();
    booking.quotationStatus = QuotationStatus.QUOTED;
    booking.status = TechnicianBookingStatus.QUOTATION_SUBMITTED;

    return this.bookingRepo.save(booking);
  }

  // ==================== 4. CUSTOMER ACCEPTS QUOTE & PAYS ADVANCE ====================

  async acceptQuotationAndPayAdvance(
    bookingId: string,
    userId: string,
    dto: AcceptQuotationDto,
  ): Promise<TechnicianBooking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking not found with ID ${bookingId}`);
    }

    if (booking.userId !== userId) {
      throw new ForbiddenException('Only the booking owner can accept this quotation');
    }

    if (booking.quotationStatus !== QuotationStatus.QUOTED) {
      throw new BadRequestException(
        `Quotation is not in QUOTED state (currently ${booking.quotationStatus})`,
      );
    }

    booking.quotationStatus = QuotationStatus.ACCEPTED;
    booking.quotationAcceptedAt = new Date();
    booking.advancePaymentStatus = PaymentStatus.COMPLETED;
    booking.advancePaymentMethod = dto.paymentMethod;
    booking.advancePaymentTransactionId = dto.paymentTransactionId || null;
    booking.customerNotes = dto.customerNotes || booking.customerNotes;
    booking.status = TechnicianBookingStatus.CONFIRMED;

    return this.bookingRepo.save(booking);
  }

  // ==================== 5. STATUS PROGRESSION (EN_ROUTE / ARRIVED) ====================

  async updateJobStatus(
    bookingId: string,
    technicianUserId: string,
    newStatus: TechnicianBookingStatus,
  ): Promise<TechnicianBooking> {
    const profile = await this.techProfileRepo.findOne({
      where: { userId: technicianUserId },
    });
    if (!profile) {
      throw new ForbiddenException('Unauthorized technician');
    }

    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) {
      throw new NotFoundException(`Booking not found with ID ${bookingId}`);
    }

    if (booking.technicianProfileId !== profile.id) {
      throw new ForbiddenException('Not assigned to this booking');
    }

    const allowedTransitions: Record<TechnicianBookingStatus, TechnicianBookingStatus[]> = {
      [TechnicianBookingStatus.SEARCHING]: [TechnicianBookingStatus.ACCEPTED, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.REQUESTED]: [TechnicianBookingStatus.ACCEPTED, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.ACCEPTED]: [TechnicianBookingStatus.QUOTATION_SUBMITTED, TechnicianBookingStatus.EN_ROUTE, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.QUOTATION_SUBMITTED]: [TechnicianBookingStatus.CONFIRMED, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.CONFIRMED]: [TechnicianBookingStatus.EN_ROUTE, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.EN_ROUTE]: [TechnicianBookingStatus.ARRIVED, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.ARRIVED]: [TechnicianBookingStatus.IN_PROGRESS, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.IN_PROGRESS]: [TechnicianBookingStatus.COMPLETED, TechnicianBookingStatus.CANCELLED],
      [TechnicianBookingStatus.COMPLETED]: [],
      [TechnicianBookingStatus.CANCELLED]: [],
    };

    if (!allowedTransitions[booking.status]?.includes(newStatus)) {
      throw new BadRequestException(
        `Cannot transition booking status from ${booking.status} to ${newStatus}`,
      );
    }

    booking.status = newStatus;
    return this.bookingRepo.save(booking);
  }

  // ==================== 6. START OTP VERIFICATION ====================

  async verifyStartOtp(
    bookingId: string,
    technicianUserId: string,
    otp: string,
  ): Promise<TechnicianBooking> {
    const profile = await this.techProfileRepo.findOne({
      where: { userId: technicianUserId },
    });
    if (!profile) throw new ForbiddenException('Unauthorized');

    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.technicianProfileId !== profile.id) {
      throw new ForbiddenException('Not assigned to this booking');
    }

    if (booking.startOtp !== otp.trim()) {
      throw new BadRequestException('Invalid 6-digit Start OTP provided by customer');
    }

    booking.status = TechnicianBookingStatus.IN_PROGRESS;
    return this.bookingRepo.save(booking);
  }

  // ==================== 7. COMPLETE JOB & COLLECT REMAINING BALANCE ====================

  async completeJob(
    bookingId: string,
    technicianUserId: string,
    otp: string,
  ): Promise<TechnicianBooking> {
    const profile = await this.techProfileRepo.findOne({
      where: { userId: technicianUserId },
    });
    if (!profile) throw new ForbiddenException('Unauthorized');

    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (booking.technicianProfileId !== profile.id) {
      throw new ForbiddenException('Not assigned to this booking');
    }

    if (booking.completionOtp !== otp.trim()) {
      throw new BadRequestException('Invalid 6-digit Completion OTP provided by customer');
    }

    booking.status = TechnicianBookingStatus.COMPLETED;
    booking.remainingPaymentStatus = PaymentStatus.COMPLETED; // Collected directly by provider
    booking.completedAt = new Date();
    return this.bookingRepo.save(booking);
  }

  // ==================== 8. CANCEL BOOKING ====================

  async cancelBooking(
    bookingId: string,
    actorId: string,
    reason: string,
    cancelledBy: 'USER' | 'TECHNICIAN' | 'ADMIN',
  ): Promise<TechnicianBooking> {
    const booking = await this.bookingRepo.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    if (
      booking.status === TechnicianBookingStatus.COMPLETED ||
      booking.status === TechnicianBookingStatus.CANCELLED
    ) {
      throw new BadRequestException(`Cannot cancel a booking that is ${booking.status}`);
    }

    booking.status = TechnicianBookingStatus.CANCELLED;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    booking.cancelledBy = cancelledBy;

    return this.bookingRepo.save(booking);
  }

  // ==================== 9. LIST & QUERY BOOKINGS ====================

  async findAll(query: QueryTechnicianBookingsDto): Promise<PaginatedResult<TechnicianBooking>> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'user')
      .leftJoinAndSelect('b.technicianProfile', 'tech')
      .leftJoinAndSelect('tech.user', 'techUser')
      .leftJoinAndSelect('b.category', 'cat')
      .leftJoinAndSelect('b.serviceCatalogItem', 'srv');

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    if (query.bookingType) {
      qb.andWhere('b.bookingType = :bookingType', { bookingType: query.bookingType });
    }

    if (query.quotationStatus) {
      qb.andWhere('b.quotationStatus = :quotationStatus', {
        quotationStatus: query.quotationStatus,
      });
    }

    if (query.technicianProfileId) {
      qb.andWhere('b.technicianProfileId = :techId', { techId: query.technicianProfileId });
    }

    if (query.userId) {
      qb.andWhere('b.userId = :userId', { userId: query.userId });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(b.bookingNumber) LIKE LOWER(:search) OR LOWER(b.breakdownLocation) LIKE LOWER(:search) OR LOWER(b.vehiclePlateNumber) LIKE LOWER(:search) OR LOWER(user.name) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('b.createdAt', query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  async findById(id: string): Promise<TechnicianBooking> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const booking = await this.bookingRepo.findOne({
      where: isUuid ? { id } : { bookingNumber: id },
      relations: {
        user: true,
        technicianProfile: {
          user: true,
        },
        category: true,
        serviceCatalogItem: true,
        providerService: true,
      },
    });
    if (!booking) {
      throw new NotFoundException(`Technician booking not found with ID ${id}`);
    }
    return booking;
  }
}
