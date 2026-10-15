import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ParkingOperator } from './entities/parking-operator.entity';
import { ParkingLocation } from './entities/parking-location.entity';
import { ParkingBooking } from './entities/parking-booking.entity';
import { SystemSetting } from '../settings/entities/system-setting.entity';
import { CreateParkingLocationDto } from './dto/create-parking-location.dto';
import { UpdateParkingLocationDto } from './dto/update-parking-location.dto';
import { UpdateParkingInventoryDto } from './dto/update-parking-inventory.dto';
import { QueryParkingLocationsDto } from './dto/query-parking-locations.dto';
import { CalculateParkingQuoteDto } from './dto/calculate-parking-quote.dto';
import { HoldParkingSlotDto } from './dto/hold-parking-slot.dto';
import { ConfirmParkingPaymentDto } from './dto/confirm-parking-payment.dto';
import { VerifyParkingEntryDto } from './dto/verify-parking-entry.dto';
import { CheckoutParkingDto } from './dto/checkout-parking.dto';
import { WalkinParkingCheckinDto } from './dto/walkin-parking-checkin.dto';
import { UpdateParkingSettingsDto } from './dto/update-parking-settings.dto';
import { QueryParkingBookingsDto } from './dto/query-parking-bookings.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import {
  ParkingLocationStatus,
  ParkingBookingStatus,
  ParkingPaymentStatus,
  ParkingRefundStatus,
  ParkingVehicleType,
} from '../../common/enums/parking-status.enum';
import { Role } from '../users/entities/role.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { ProfessionalApplication } from '../applications/entities/professional-application.entity';
import { BusinessRole, ProfessionalRole } from '../../common/enums/business-role.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum';
import { ICurrentUser } from '../../common/interfaces/current-user.interface';

@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(ParkingOperator)
    private readonly operatorRepo: Repository<ParkingOperator>,
    @InjectRepository(ParkingLocation)
    private readonly locationRepo: Repository<ParkingLocation>,
    @InjectRepository(ParkingBooking)
    private readonly bookingRepo: Repository<ParkingBooking>,
    @InjectRepository(SystemSetting)
    private readonly settingRepo: Repository<SystemSetting>,
    private readonly dataSource: DataSource,
  ) {}

  // -------------------------------------------------------------
  // OPERATOR & FACILITY MANAGEMENT
  // -------------------------------------------------------------

  async findOperatorByUserId(userId: string): Promise<ParkingOperator> {
    const operator = await this.operatorRepo.findOne({
      where: { userId },
      relations: {
        user: true,
        locations: true,
      },
    });
    if (!operator) {
      throw new NotFoundException('Parking operator profile not found for user');
    }
    return operator;
  }

  async createLocation(
    userId: string,
    dto: CreateParkingLocationDto,
  ): Promise<ParkingLocation> {
    const operator = await this.findOperatorByUserId(userId);

    if (operator.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Operator must be VERIFIED before managing active parking locations or inventory',
      );
    }

    const totalCapacity = dto.carSlotsTotal + dto.bikeSlotsTotal;
    const location = this.locationRepo.create({
      ...dto,
      operatorId: operator.id,
      capacity: totalCapacity,
      availableSpaces: totalCapacity,
      availableCarSlots: dto.carSlotsTotal,
      availableBikeSlots: dto.bikeSlotsTotal,
      status: ParkingLocationStatus.ACTIVE,
    });

    return this.locationRepo.save(location);
  }

  async updateLocation(
    locationId: string,
    user: ICurrentUser,
    dto: UpdateParkingLocationDto,
  ): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({
      where: { id: locationId },
      relations: {
        operator: true,
      },
    });
    if (!location) {
      throw new NotFoundException('Parking location not found');
    }

    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException('Unauthorized: You cannot modify this parking facility');
    }

    if (dto.carSlotsTotal !== undefined || dto.bikeSlotsTotal !== undefined) {
      const newCarTotal = dto.carSlotsTotal ?? location.carSlotsTotal;
      const newBikeTotal = dto.bikeSlotsTotal ?? location.bikeSlotsTotal;
      location.capacity = newCarTotal + newBikeTotal;

      const carDiff = newCarTotal - location.carSlotsTotal;
      const bikeDiff = newBikeTotal - location.bikeSlotsTotal;

      location.availableCarSlots = Math.max(0, location.availableCarSlots + carDiff);
      location.availableBikeSlots = Math.max(0, location.availableBikeSlots + bikeDiff);
      location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
    }

    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async updateInventory(
    locationId: string,
    user: ICurrentUser,
    dto: UpdateParkingInventoryDto,
  ): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({
      where: { id: locationId },
      relations: {
        operator: true,
      },
    });
    if (!location) {
      throw new NotFoundException('Parking location not found');
    }

    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException('Unauthorized: You cannot update inventory for this facility');
    }

    if (dto.availableCarSlots !== undefined) {
      if (dto.availableCarSlots > location.carSlotsTotal) {
        throw new BadRequestException(
          `Available car slots (${dto.availableCarSlots}) cannot exceed total capacity (${location.carSlotsTotal})`,
        );
      }
      location.availableCarSlots = dto.availableCarSlots;
    }

    if (dto.availableBikeSlots !== undefined) {
      if (dto.availableBikeSlots > location.bikeSlotsTotal) {
        throw new BadRequestException(
          `Available bike slots (${dto.availableBikeSlots}) cannot exceed total capacity (${location.bikeSlotsTotal})`,
        );
      }
      location.availableBikeSlots = dto.availableBikeSlots;
    }

    location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;

    if (location.availableSpaces === 0) {
      location.status = ParkingLocationStatus.FULL;
    } else if (location.status === ParkingLocationStatus.FULL) {
      location.status = ParkingLocationStatus.ACTIVE;
    }

    return this.locationRepo.save(location);
  }

  async getMyLocations(userId: string): Promise<ParkingLocation[]> {
    const operator = await this.findOperatorByUserId(userId);
    return this.locationRepo.find({
      where: { operatorId: operator.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findLocationById(id: string): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({
      where: { id },
      relations: {
        operator: true,
      },
    });
    if (!location) {
      throw new NotFoundException(`Parking location ${id} not found`);
    }
    return location;
  }

  async findAll(query: QueryParkingLocationsDto): Promise<PaginatedResult<ParkingLocation>> {
    const qb = this.locationRepo
      .createQueryBuilder('loc')
      .leftJoinAndSelect('loc.operator', 'operator');

    if (query.status) {
      qb.andWhere('loc.status = :status', { status: query.status });
    }

    if (query.city) {
      qb.andWhere('LOWER(loc.city) = LOWER(:city)', { city: query.city });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(loc.name) LIKE LOWER(:search) OR LOWER(loc.address) LIKE LOWER(:search) OR LOWER(loc.landmark) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('loc.createdAt', query.sortOrder || 'DESC');
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

  // -------------------------------------------------------------
  // ADVANCE SETTINGS & QUOTING LOGIC
  // -------------------------------------------------------------

  private async getSetting(key: string, defaultValue: string): Promise<string> {
    const setting = await this.settingRepo.findOne({ where: { key } });
    return setting?.value ?? defaultValue;
  }

  async calculateQuote(dto: CalculateParkingQuoteDto) {
    const location = await this.findLocationById(dto.locationId);

    const isBookingEnabled = (await this.getSetting('PARKING_BOOKING_ENABLED', 'true')) === 'true';
    if (!isBookingEnabled) {
      throw new BadRequestException('Parking bookings are temporarily disabled on the platform');
    }

    const duration = dto.durationHours || 2;
    const isBike = dto.vehicleType === ParkingVehicleType.BIKE;
    const availableSlots = isBike ? location.availableBikeSlots : location.availableCarSlots;
    const isAvailable = availableSlots > 0 && location.status !== ParkingLocationStatus.INACTIVE;

    // Rate calculation based on vehicle type
    let hourlyRate = isBike ? Number(location.bikeHourlyRate) : Number(location.carHourlyRate);
    if (dto.vehicleType === ParkingVehicleType.SUV) {
      hourlyRate = Math.round(hourlyRate * 1.25);
    } else if (dto.vehicleType === ParkingVehicleType.EV) {
      hourlyRate = Math.round(hourlyRate * 1.1);
    }

    // 24-Hour cap rule if applicable
    let basePrice = hourlyRate * duration;
    if (duration >= 24 && location.carDailyRate && !isBike) {
      const days = Math.floor(duration / 24);
      const remHours = duration % 24;
      basePrice = days * Number(location.carDailyRate) + remHours * hourlyRate;
    }

    const platformFee = 15;
    let addonsPrice = 0;
    if (dto.selectedAddonIds && dto.selectedAddonIds.length > 0 && Array.isArray(location.addonServices)) {
      for (const addonId of dto.selectedAddonIds) {
        const found = location.addonServices.find((a: any) => a.id === addonId);
        if (found) {
          addonsPrice += Number(found.price) || 0;
        }
      }
    }
    const totalAmount = basePrice + addonsPrice + platformFee;

    // Unified parking admin commission & prepaid advance percentage (single setting like driver rides)
    const parkingCommissionPercentage =
      parseFloat(
        await this.getSetting(
          'PARKING_COMMISSION_PERCENTAGE',
          await this.getSetting('PARKING_ADVANCE_VALUE', '20'),
        ),
      ) || 20;

    const advanceAmount = Math.round((totalAmount * parkingCommissionPercentage) / 100);
    const remainingAmount = totalAmount - advanceAmount;

    // Commission snapshot
    const commissionRate = parkingCommissionPercentage;
    const commissionAmount = Math.round((basePrice * commissionRate) / 100);

    const cancellationPolicy = await this.getSetting(
      'PARKING_CANCELLATION_POLICY',
      'Free cancellation up to 1 hour before scheduled check-in. 50% refund within 1 hour. No refund on no-show.',
    );

    return {
      locationId: location.id,
      locationName: location.name,
      vehicleType: dto.vehicleType,
      checkInTime: dto.checkInTime,
      durationHours: duration,
      hourlyRate,
      basePrice,
      addonsPrice,
      platformFee,
      totalAmount,
      advanceAmount,
      remainingAmount,
      commissionRate,
      commissionAmount,
      isAvailable,
      availableSlots,
      cancellationPolicy,
    };
  }

  // -------------------------------------------------------------
  // ATOMIC CAPACITY HOLD & BOOKING FLOW
  // -------------------------------------------------------------

  async holdSlot(userId: string, dto: HoldParkingSlotDto): Promise<ParkingBooking> {
    return this.dataSource.transaction(async (manager) => {
      // 1. Lock the parking location row to guarantee zero race-condition overbooking
      const location = await manager.findOne(ParkingLocation, {
        where: { id: dto.locationId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!location) {
        throw new NotFoundException('Parking facility not found');
      }

      if (location.status === ParkingLocationStatus.INACTIVE) {
        throw new BadRequestException('This parking facility is currently closed for bookings');
      }

      const isBike = dto.vehicleType === ParkingVehicleType.BIKE;
      if (isBike) {
        if (location.availableBikeSlots <= 0) {
          throw new BadRequestException('No available two-wheeler bays at this facility');
        }
        location.availableBikeSlots -= 1;
      } else {
        if (location.availableCarSlots <= 0) {
          throw new BadRequestException('No available car parking bays at this facility');
        }
        location.availableCarSlots -= 1;
      }

      location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
      if (location.availableSpaces === 0) {
        location.status = ParkingLocationStatus.FULL;
      }
      await manager.save(location);

      // 2. Compute financial snapshot
      const quote = await this.calculateQuote({
        locationId: dto.locationId,
        vehicleType: dto.vehicleType,
        checkInTime: dto.checkInTime,
        durationHours: dto.durationHours || 2,
        selectedAddonIds: dto.selectedAddonIds,
      });

      const addonsTotal = dto.addonsPrice ? Number(dto.addonsPrice) : 0;
      const finalTotal = quote.basePrice + addonsTotal + quote.platformFee;
      let advanceAmount = quote.advanceAmount;
      if (addonsTotal > 0) {
        advanceAmount = Math.min(finalTotal, advanceAmount + Math.round(addonsTotal * 0.25));
      }
      const remainingAmount = finalTotal - advanceAmount;

      // 3. Generate unique booking number, 6-digit gate OTP PIN, and QR payload
      const bookingNumber = `PRK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const gatePinOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const qrCodePayload = JSON.stringify({
        bookingNumber,
        pin: gatePinOtp,
        locationId: location.id,
        vehicleNumber: dto.vehicleNumber,
      });

      const checkInDate = new Date(dto.checkInTime);
      const checkOutDate = new Date(checkInDate.getTime() + (dto.durationHours || 2) * 3600000);
      const holdExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes temporary hold

      const booking = manager.create(ParkingBooking, {
        bookingNumber,
        userId,
        locationId: location.id,
        vehicleType: dto.vehicleType,
        vehicleNumber: dto.vehicleNumber.trim().toUpperCase(),
        checkInTime: checkInDate,
        checkOutTime: checkOutDate,
        durationHours: dto.durationHours || 2,
        allocatedFloor: dto.allocatedFloor || 'Ground / B1',
        allocatedBay: dto.allocatedBay || `Bay ${Math.floor(10 + Math.random() * 40)}`,
        hourlyRate: quote.hourlyRate,
        basePrice: quote.basePrice,
        addonsPrice: addonsTotal,
        platformFee: quote.platformFee,
        discountAmount: 0,
        totalAmount: finalTotal,
        advanceAmount,
        remainingAmount,
        commissionRate: quote.commissionRate,
        commissionAmount: quote.commissionAmount,
        providerEarnings: finalTotal - quote.commissionAmount,
        status: ParkingBookingStatus.PENDING_PAYMENT,
        paymentStatus: ParkingPaymentStatus.PENDING,
        refundStatus: ParkingRefundStatus.NOT_REQUIRED,
        gatePinOtp,
        qrCodePayload,
        holdExpiresAt,
        metadata: {
          notes: dto.notes,
          cancellationPolicy: quote.cancellationPolicy,
          selectedAddonIds: dto.selectedAddonIds,
        },
      });

      return manager.save(booking);
    });
  }

  async confirmPayment(
    bookingId: string,
    userId: string,
    dto: ConfirmParkingPaymentDto,
  ): Promise<ParkingBooking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(ParkingBooking, {
        where: { id: bookingId },
        relations: { location: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      // Idempotency: if already confirmed with valid payment, return safely
      if (booking.status === ParkingBookingStatus.CONFIRMED) {
        return booking;
      }

      if (booking.status !== ParkingBookingStatus.PENDING_PAYMENT) {
        throw new BadRequestException(
          `Cannot confirm payment for booking with status ${booking.status}`,
        );
      }

      // Check if hold expired
      if (booking.holdExpiresAt && new Date() > booking.holdExpiresAt) {
        // Release held capacity back to location
        const location = await manager.findOne(ParkingLocation, {
          where: { id: booking.locationId },
        });
        if (location) {
          if (booking.vehicleType === ParkingVehicleType.BIKE) {
            location.availableBikeSlots += 1;
          } else {
            location.availableCarSlots += 1;
          }
          location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
          await manager.save(location);
        }
        booking.status = ParkingBookingStatus.EXPIRED;
        booking.paymentStatus = ParkingPaymentStatus.FAILED;
        await manager.save(booking);
        throw new BadRequestException('Temporary reservation hold expired. Please re-book slot.');
      }

      booking.status = ParkingBookingStatus.CONFIRMED;
      booking.paymentStatus = ParkingPaymentStatus.PAID;
      booking.advancePaidAt = new Date();
      booking.paymentMethod = dto.paymentMethod;
      booking.transactionId = dto.transactionId || `TXN-${Date.now()}`;
      booking.holdExpiresAt = null;

      return manager.save(booking);
    });
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    reason?: string,
  ): Promise<ParkingBooking> {
    return this.dataSource.transaction(async (manager) => {
      const booking = await manager.findOne(ParkingBooking, {
        where: { id: bookingId },
        relations: { location: true },
      });

      if (!booking) {
        throw new NotFoundException('Booking not found');
      }

      if (booking.userId !== userId) {
        throw new ForbiddenException('Unauthorized: You can only cancel your own bookings');
      }

      if (
        booking.status === ParkingBookingStatus.CANCELLED ||
        booking.status === ParkingBookingStatus.COMPLETED ||
        booking.status === ParkingBookingStatus.CHECKED_IN
      ) {
        throw new BadRequestException(`Cannot cancel booking in ${booking.status} state`);
      }

      // Release slot capacity back to location
      const location = await manager.findOne(ParkingLocation, {
        where: { id: booking.locationId },
      });
      if (location) {
        if (booking.vehicleType === ParkingVehicleType.BIKE) {
          location.availableBikeSlots += 1;
        } else {
          location.availableCarSlots += 1;
        }
        location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
        if (location.status === ParkingLocationStatus.FULL && location.availableSpaces > 0) {
          location.status = ParkingLocationStatus.ACTIVE;
        }
        await manager.save(location);
      }

      // Calculate refund based on advance amount and notice window
      const hoursUntilCheckIn =
        (booking.checkInTime.getTime() - Date.now()) / (1000 * 60 * 60);
      let refundAmount = 0;
      if (booking.paymentStatus === ParkingPaymentStatus.PAID) {
        if (hoursUntilCheckIn >= 1.0) {
          refundAmount = booking.advanceAmount; // 100% refund
        } else if (hoursUntilCheckIn > 0) {
          refundAmount = Math.round(booking.advanceAmount * 0.5); // 50% refund
        }
      }

      booking.status = ParkingBookingStatus.CANCELLED;
      booking.cancellationReason = reason || 'Cancelled by customer';
      booking.cancelledAt = new Date();
      booking.refundAmount = refundAmount;
      booking.refundStatus =
        refundAmount > 0
          ? ParkingRefundStatus.COMPLETED
          : ParkingRefundStatus.NOT_REQUIRED;
      booking.paymentStatus =
        refundAmount === booking.advanceAmount && refundAmount > 0
          ? ParkingPaymentStatus.REFUNDED
          : refundAmount > 0
          ? ParkingPaymentStatus.PARTIALLY_REFUNDED
          : booking.paymentStatus;

      return manager.save(booking);
    });
  }

  // -------------------------------------------------------------
  // USER BOOKINGS QUERIES
  // -------------------------------------------------------------

  async getUserBookings(
    userId: string,
    query: QueryParkingBookingsDto,
  ): Promise<PaginatedResult<ParkingBooking>> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.location', 'loc')
      .where('b.userId = :userId', { userId });

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    if (query.vehicleType) {
      qb.andWhere('b.vehicleType = :vehicleType', { vehicleType: query.vehicleType });
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

  async getBookingById(bookingId: string, user: ICurrentUser): Promise<ParkingBooking> {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
      relations: {
        location: {
          operator: true,
        },
        user: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Parking booking not found');
    }

    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    const isOwnerOperator = booking.location?.operator?.userId === user.userId;
    const isCustomer = booking.userId === user.userId;

    if (!isAdmin && !isOwnerOperator && !isCustomer) {
      throw new ForbiddenException('Unauthorized to view this parking booking');
    }

    return booking;
  }

  // -------------------------------------------------------------
  // PARKING OPERATOR / GATE APP OPERATIONS
  // -------------------------------------------------------------

  async getLocationBookings(
    locationId: string,
    user: ICurrentUser,
    query: QueryParkingBookingsDto,
  ): Promise<PaginatedResult<ParkingBooking>> {
    const location = await this.findLocationById(locationId);
    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException('Unauthorized to view bookings for this facility');
    }

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'user')
      .where('b.locationId = :locationId', { locationId });

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(b.vehicleNumber) LIKE LOWER(:s) OR b.bookingNumber LIKE :s OR b.gatePinOtp = :exact OR LOWER(user.name) LIKE LOWER(:s))',
        { s: `%${query.search}%`, exact: query.search },
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

  async verifyAndCheckIn(
    locationId: string,
    user: ICurrentUser,
    dto: VerifyParkingEntryDto,
  ): Promise<ParkingBooking> {
    const location = await this.findLocationById(locationId);
    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException('Unauthorized to operate gate for this facility');
    }
    if (!isAdmin && location.operator.verificationStatus === VerificationStatus.SUSPENDED) {
      throw new ForbiddenException(
        'Your parking operator account has been disabled/suspended by administrator. Gate operations are blocked.',
      );
    }

    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.user', 'user')
      .where('b.locationId = :locationId', { locationId });

    if (dto.gatePinOtp) {
      qb.andWhere('b.gatePinOtp = :pin', { pin: dto.gatePinOtp.trim() });
    } else if (dto.qrCodePayload) {
      const raw = dto.qrCodePayload.trim();
      let matched = false;
      try {
        if (raw.startsWith('{') && raw.endsWith('}')) {
          const parsed = JSON.parse(raw);
          if (parsed.bookingNumber) {
            qb.andWhere('b.bookingNumber = :bn', { bn: String(parsed.bookingNumber).trim() });
            matched = true;
          } else if (parsed.pin) {
            qb.andWhere('b.gatePinOtp = :pin', { pin: String(parsed.pin).trim() });
            matched = true;
          }
        }
      } catch (_) {}
      if (!matched) {
        qb.andWhere('(b.qrCodePayload = :qr OR b.bookingNumber = :qr OR b.gatePinOtp = :qr)', {
          qr: raw,
        });
      }
    } else if (dto.bookingNumber) {
      qb.andWhere('b.bookingNumber = :bn', { bn: dto.bookingNumber.trim() });
    } else if (dto.vehicleNumber) {
      qb.andWhere('LOWER(b.vehicleNumber) = LOWER(:vn)', {
        vn: dto.vehicleNumber.trim().toUpperCase(),
      });
    } else {
      throw new BadRequestException('Please provide Gate PIN, QR pass, or Vehicle Plate');
    }

    qb.andWhere('b.status IN (:...validStatuses)', {
      validStatuses: [ParkingBookingStatus.CONFIRMED, ParkingBookingStatus.CHECKED_IN],
    });

    const booking = await qb.getOne();
    if (!booking) {
      throw new NotFoundException(
        'No confirmed booking found matching this entry pass at this facility',
      );
    }

    if (booking.status === ParkingBookingStatus.CHECKED_IN) {
      return booking; // Idempotent check-in
    }

    booking.status = ParkingBookingStatus.CHECKED_IN;
    booking.actualCheckInTime = new Date();
    if (dto.allocatedBay) {
      booking.allocatedBay = dto.allocatedBay;
    }

    return this.bookingRepo.save(booking);
  }

  async checkOut(
    locationId: string,
    bookingId: string,
    user: ICurrentUser,
    dto: CheckoutParkingDto,
  ): Promise<ParkingBooking> {
    return this.dataSource.transaction(async (manager) => {
      const location = await manager.findOne(ParkingLocation, {
        where: { id: locationId },
        relations: { operator: true },
      });
      if (!location) {
        throw new NotFoundException('Parking facility not found');
      }

      const isAdmin =
        user.roles.includes(BusinessRole.ADMIN) ||
        user.roles.includes(BusinessRole.SUPER_ADMIN);
      if (!isAdmin && location.operator.userId !== user.userId) {
        throw new ForbiddenException('Unauthorized to record vehicle exit');
      }
      if (!isAdmin && location.operator.verificationStatus === VerificationStatus.SUSPENDED) {
        throw new ForbiddenException(
          'Your parking operator account has been disabled/suspended by administrator. Gate operations are blocked.',
        );
      }

      const booking = await manager.findOne(ParkingBooking, {
        where: { id: bookingId, locationId },
      });
      if (!booking) {
        throw new NotFoundException('Booking not found at this facility');
      }

      if (booking.status === ParkingBookingStatus.COMPLETED) {
        return booking; // Idempotent
      }

      if (booking.status !== ParkingBookingStatus.CHECKED_IN) {
        throw new BadRequestException(
          `Cannot check-out booking currently with status ${booking.status}`,
        );
      }

      const checkInTime = booking.actualCheckInTime || booking.checkInTime;
      const now = new Date();
      const actualDurationHours = Math.max(
        1,
        Math.ceil((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)),
      );

      // Overtime charges calculation
      let extraHoursCharge = 0;
      if (actualDurationHours > booking.durationHours) {
        const extraHours = actualDurationHours - booking.durationHours;
        extraHoursCharge = extraHours * Number(booking.hourlyRate);
      }

      const updatedTotal = Number(booking.totalAmount) + extraHoursCharge;
      let finalRemaining = updatedTotal - Number(booking.advanceAmount);
      if (dto.discountAmount && dto.discountAmount > 0) {
        finalRemaining = Math.max(0, finalRemaining - dto.discountAmount);
      }

      // Re-release slot capacity
      if (booking.vehicleType === ParkingVehicleType.BIKE) {
        location.availableBikeSlots = Math.min(
          location.bikeSlotsTotal,
          location.availableBikeSlots + 1,
        );
      } else {
        location.availableCarSlots = Math.min(
          location.carSlotsTotal,
          location.availableCarSlots + 1,
        );
      }
      location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
      if (location.status === ParkingLocationStatus.FULL && location.availableSpaces > 0) {
        location.status = ParkingLocationStatus.ACTIVE;
      }
      await manager.save(location);

      booking.status = ParkingBookingStatus.COMPLETED;
      booking.actualCheckOutTime = now;
      booking.extraHoursCharge = extraHoursCharge;
      booking.totalAmount = updatedTotal;
      booking.remainingAmount = finalRemaining;
      booking.remainingPaidAt = now;
      booking.paymentStatus = ParkingPaymentStatus.PAID;
      booking.providerEarnings = updatedTotal - Number(booking.commissionAmount);

      return manager.save(booking);
    });
  }

  async walkInCheckIn(
    locationId: string,
    user: ICurrentUser,
    dto: WalkinParkingCheckinDto,
  ): Promise<ParkingBooking> {
    return this.dataSource.transaction(async (manager) => {
      const location = await manager.findOne(ParkingLocation, {
        where: { id: locationId },
        relations: { operator: true },
      });
      if (!location) {
        throw new NotFoundException('Parking facility not found');
      }

      const isAdmin =
        user.roles.includes(BusinessRole.ADMIN) ||
        user.roles.includes(BusinessRole.SUPER_ADMIN);
      if (!isAdmin && location.operator.userId !== user.userId) {
        throw new ForbiddenException('Unauthorized to check in walk-in vehicle');
      }
      if (!isAdmin && location.operator.verificationStatus === VerificationStatus.SUSPENDED) {
        throw new ForbiddenException(
          'Your parking operator account has been disabled/suspended by administrator. Gate operations are blocked.',
        );
      }

      const isBike = dto.vehicleType === ParkingVehicleType.BIKE;
      if (isBike) {
        if (location.availableBikeSlots <= 0) {
          throw new BadRequestException('No available two-wheeler bays');
        }
        location.availableBikeSlots -= 1;
      } else {
        if (location.availableCarSlots <= 0) {
          throw new BadRequestException('No available car bays');
        }
        location.availableCarSlots -= 1;
      }
      location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
      await manager.save(location);

      const duration = dto.expectedDurationHours || 2;
      const hourlyRate = isBike ? Number(location.bikeHourlyRate) : Number(location.carHourlyRate);
      const totalAmount = hourlyRate * duration;

      const bookingNumber = `WLK-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const gatePinOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const qrCodePayload = JSON.stringify({
        bookingNumber,
        pin: gatePinOtp,
        locationId: location.id,
        vehicleNumber: dto.vehicleNumber,
      });

      const now = new Date();
      const checkOutDate = new Date(now.getTime() + duration * 3600000);

      const booking = manager.create(ParkingBooking, {
        bookingNumber,
        userId: user.userId, // Operator user ID as creator
        locationId: location.id,
        vehicleType: dto.vehicleType,
        vehicleNumber: dto.vehicleNumber.trim().toUpperCase(),
        checkInTime: now,
        actualCheckInTime: now,
        checkOutTime: checkOutDate,
        durationHours: duration,
        allocatedBay: dto.allocatedBay || `Bay W-${Math.floor(1 + Math.random() * 50)}`,
        hourlyRate,
        basePrice: totalAmount,
        addonsPrice: 0,
        platformFee: 0,
        discountAmount: 0,
        totalAmount,
        advanceAmount: 0, // Walk-in pays at exit
        remainingAmount: totalAmount,
        commissionRate: 15,
        commissionAmount: Math.round((totalAmount * 15) / 100),
        providerEarnings: totalAmount - Math.round((totalAmount * 15) / 100),
        status: ParkingBookingStatus.CHECKED_IN,
        paymentStatus: ParkingPaymentStatus.PENDING,
        refundStatus: ParkingRefundStatus.NOT_REQUIRED,
        gatePinOtp,
        qrCodePayload,
        isWalkIn: true,
      });

      return manager.save(booking);
    });
  }

  async getLocationStats(locationId: string, user: ICurrentUser) {
    const location = await this.findLocationById(locationId);
    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException('Unauthorized to view stats');
    }

    const activeParkedCount = await this.bookingRepo.count({
      where: {
        locationId,
        status: ParkingBookingStatus.CHECKED_IN,
      },
    });

    const upcomingCount = await this.bookingRepo.count({
      where: {
        locationId,
        status: ParkingBookingStatus.CONFIRMED,
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = await this.bookingRepo
      .createQueryBuilder('b')
      .where('b.locationId = :locationId', { locationId })
      .andWhere('b.status = :status', { status: ParkingBookingStatus.COMPLETED })
      .andWhere('b.actualCheckOutTime >= :todayStart', { todayStart })
      .getMany();

    const todayEarnings = completedToday.reduce(
      (sum, b) => sum + Number(b.providerEarnings || 0),
      0,
    );

    return {
      locationId: location.id,
      locationName: location.name,
      totalCapacity: location.capacity,
      availableSpaces: location.availableSpaces,
      availableCarSlots: location.availableCarSlots,
      availableBikeSlots: location.availableBikeSlots,
      activeParkedCount,
      upcomingCount,
      todayCompletedCount: completedToday.length,
      todayEarnings,
    };
  }

  // -------------------------------------------------------------
  // ADMIN PANEL: SETTINGS & GLOBAL BOOKINGS
  // -------------------------------------------------------------

  async getParkingSettings() {
    return {
      parkingBookingEnabled:
        (await this.getSetting('PARKING_BOOKING_ENABLED', 'true')) === 'true',
      commissionType: await this.getSetting('PARKING_COMMISSION_TYPE', 'PERCENTAGE'),
      commissionRate: parseFloat(await this.getSetting('PARKING_COMMISSION_RATE', '15')),
      advanceType: await this.getSetting('PARKING_ADVANCE_TYPE', 'PERCENTAGE'),
      advanceValue: parseFloat(await this.getSetting('PARKING_ADVANCE_VALUE', '25')),
      minAdvanceAmount: parseFloat(await this.getSetting('PARKING_MIN_ADVANCE_AMOUNT', '20')),
      maxAdvanceAmount: parseFloat(await this.getSetting('PARKING_MAX_ADVANCE_AMOUNT', '500')),
      gracePeriodMins: parseInt(await this.getSetting('PARKING_GRACE_PERIOD_MINS', '15'), 10),
      cancellationPolicy: await this.getSetting(
        'PARKING_CANCELLATION_POLICY',
        'Free cancellation up to 1 hour before scheduled arrival. 50% refund within 1 hour. No refund on no-show.',
      ),
    };
  }

  async updateParkingSettings(dto: UpdateParkingSettingsDto, adminUserId: string) {
    const entries: [string, string | undefined, string][] = [
      ['PARKING_BOOKING_ENABLED', dto.parkingBookingEnabled !== undefined ? String(dto.parkingBookingEnabled) : undefined, 'Enable/disable parking bookings'],
      ['PARKING_COMMISSION_TYPE', dto.commissionType, 'Parking commission calculation method'],
      ['PARKING_COMMISSION_RATE', dto.commissionRate !== undefined ? String(dto.commissionRate) : undefined, 'Parking commission rate in percent or fixed amount'],
      ['PARKING_ADVANCE_TYPE', dto.advanceType, 'Prepaid advance collection type'],
      ['PARKING_ADVANCE_VALUE', dto.advanceValue !== undefined ? String(dto.advanceValue) : undefined, 'Prepaid advance value in percent or fixed amount'],
      ['PARKING_MIN_ADVANCE_AMOUNT', dto.minAdvanceAmount !== undefined ? String(dto.minAdvanceAmount) : undefined, 'Minimum advance cap in INR'],
      ['PARKING_MAX_ADVANCE_AMOUNT', dto.maxAdvanceAmount !== undefined ? String(dto.maxAdvanceAmount) : undefined, 'Maximum advance cap in INR'],
      ['PARKING_GRACE_PERIOD_MINS', dto.gracePeriodMins !== undefined ? String(dto.gracePeriodMins) : undefined, 'Grace period before no-show'],
      ['PARKING_CANCELLATION_POLICY', dto.cancellationPolicy, 'Customer cancellation terms & refund schedule'],
    ];

    for (const [key, value, desc] of entries) {
      if (value !== undefined) {
        let setting = await this.settingRepo.findOne({ where: { key } });
        if (!setting) {
          setting = this.settingRepo.create({
            key,
            value,
            category: 'PARKING',
            description: desc,
            isSecret: false,
          });
        } else {
          setting.value = value;
        }
        await this.settingRepo.save(setting);
      }
    }

    return this.getParkingSettings();
  }

  async getAdminBookings(query: QueryParkingBookingsDto): Promise<{
    bookings: PaginatedResult<ParkingBooking>;
    metrics: {
      totalBookings: number;
      totalAdvanceCollected: number;
      totalPlatformCommission: number;
      totalProviderEarnings: number;
    };
  }> {
    const qb = this.bookingRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.location', 'loc')
      .leftJoinAndSelect('loc.operator', 'op')
      .leftJoinAndSelect('b.user', 'user');

    if (query.status) {
      qb.andWhere('b.status = :status', { status: query.status });
    }

    if (query.locationId) {
      qb.andWhere('b.locationId = :locId', { locId: query.locationId });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(b.bookingNumber) LIKE LOWER(:s) OR LOWER(b.vehicleNumber) LIKE LOWER(:s) OR LOWER(loc.name) LIKE LOWER(:s) OR LOWER(user.name) LIKE LOWER(:s))',
        { s: `%${query.search}%` },
      );
    }

    qb.orderBy('b.createdAt', query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    // Financial totals across all eligible records
    const financialTotals = await this.bookingRepo
      .createQueryBuilder('b')
      .select('SUM(b.advanceAmount)', 'totalAdvance')
      .addSelect('SUM(b.commissionAmount)', 'totalCommission')
      .addSelect('SUM(b.providerEarnings)', 'totalProviderEarnings')
      .where('b.status IN (:...paidStatuses)', {
        paidStatuses: [
          ParkingBookingStatus.CONFIRMED,
          ParkingBookingStatus.CHECKED_IN,
          ParkingBookingStatus.COMPLETED,
        ],
      })
      .getRawOne();

    return {
      bookings: {
        data,
        meta: {
          total,
          page: query.page || 1,
          limit: query.limit || 10,
          totalPages: Math.ceil(total / (query.limit || 10)),
        },
      },
      metrics: {
        totalBookings: total,
        totalAdvanceCollected: parseFloat(financialTotals?.totalAdvance || '0'),
        totalPlatformCommission: parseFloat(financialTotals?.totalCommission || '0'),
        totalProviderEarnings: parseFloat(financialTotals?.totalProviderEarnings || '0'),
      },
    };
  }

  // -------------------------------------------------------------
  // OPERATOR VERIFICATION ACTIONS (EXISTING ADMIN)
  // -------------------------------------------------------------

  async findAllOperators(query: any): Promise<PaginatedResult<ParkingOperator>> {
    const qb = this.operatorRepo
      .createQueryBuilder('op')
      .leftJoinAndSelect('op.user', 'user')
      .leftJoinAndSelect('op.locations', 'loc');

    if (query?.verificationStatus) {
      qb.andWhere('op.verificationStatus = :status', { status: query.verificationStatus });
    }

    if (query?.search) {
      qb.andWhere(
        '(LOWER(op.facilityName) LIKE LOWER(:search) OR LOWER(op.ownerName) LIKE LOWER(:search) OR op.businessPhone LIKE :search OR LOWER(user.name) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('op.createdAt', query?.sortOrder || 'DESC');
    const limit = Number(query?.limit) || 10;
    const page = Number(query?.page) || 1;
    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async verifyOperator(id: string, adminUserId: string, notes?: string): Promise<ParkingOperator> {
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(ParkingOperator, {
        where: { id },
        relations: { user: true },
      });
      if (!operator) {
        throw new NotFoundException(`Parking operator ${id} not found`);
      }

      operator.verificationStatus = VerificationStatus.VERIFIED;
      const saved = await manager.save(operator);

      // Automatically activate all parking locations associated with this verified operator
      await manager.update(
        ParkingLocation,
        { operatorId: operator.id },
        { status: ParkingLocationStatus.ACTIVE },
      );

      const parkingRole = await manager.findOne(Role, {
        where: { name: BusinessRole.PARKING_OPERATOR },
      });

      if (parkingRole) {
        const existingRole = await manager.findOne(UserRole, {
          where: { userId: operator.userId, roleId: parkingRole.id },
        });

        if (!existingRole) {
          const userRole = manager.create(UserRole, {
            userId: operator.userId,
            roleId: parkingRole.id,
            assignedBy: adminUserId,
            status: RoleAssignmentStatus.ACTIVE,
          });
          await manager.save(userRole);
        }
      }

      const application = await manager.findOne(ProfessionalApplication, {
        where: {
          userId: operator.userId,
          requestedRole: ProfessionalRole.PARKING_OPERATOR,
        },
      });

      if (application) {
        application.status = ApplicationStatus.APPROVED;
        application.reviewedAt = new Date();
        application.reviewedBy = adminUserId;
        application.notes = notes || 'Operator approved by platform administration';
        await manager.save(application);
      }

      return saved;
    });
  }

  async rejectOperator(
    id: string,
    adminUserId: string,
    rejectionReason?: string,
  ): Promise<ParkingOperator> {
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(ParkingOperator, {
        where: { id },
        relations: { user: true },
      });
      if (!operator) {
        throw new NotFoundException(`Parking operator ${id} not found`);
      }

      operator.verificationStatus = VerificationStatus.REJECTED;
      const saved = await manager.save(operator);

      // Automatically deactivate all parking locations of rejected operator
      await manager.update(
        ParkingLocation,
        { operatorId: operator.id },
        { status: ParkingLocationStatus.INACTIVE },
      );

      const application = await manager.findOne(ProfessionalApplication, {
        where: {
          userId: operator.userId,
          requestedRole: ProfessionalRole.PARKING_OPERATOR,
        },
      });

      if (application) {
        application.status = ApplicationStatus.REJECTED;
        application.reviewedAt = new Date();
        application.reviewedBy = adminUserId;
        application.rejectionReason =
          rejectionReason || 'Facility failed criteria or incomplete documentation';
        await manager.save(application);
      }

      return saved;
    });
  }

  async toggleOperatorStatus(id: string, adminUserId: string): Promise<ParkingOperator> {
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(ParkingOperator, {
        where: { id },
        relations: { locations: true },
      });
      if (!operator) {
        throw new NotFoundException(`Parking operator ${id} not found`);
      }

      const isCurrentlyVerified = operator.verificationStatus === VerificationStatus.VERIFIED;
      operator.verificationStatus = isCurrentlyVerified
        ? VerificationStatus.SUSPENDED
        : VerificationStatus.VERIFIED;

      const newLocationStatus = isCurrentlyVerified
        ? ParkingLocationStatus.INACTIVE
        : ParkingLocationStatus.ACTIVE;

      if (operator.locations && operator.locations.length > 0) {
        for (const loc of operator.locations) {
          loc.status = newLocationStatus;
          await manager.save(loc);
        }
      }

      // Sync user role and professional application if operator has linked user account
      if (operator.userId) {
        const parkingRole = await manager.findOne(Role, {
          where: { name: ProfessionalRole.PARKING_OPERATOR },
        });
        if (parkingRole) {
          const userRole = await manager.findOne(UserRole, {
            where: { userId: operator.userId, roleId: parkingRole.id },
          });
          if (userRole) {
            userRole.status = isCurrentlyVerified
              ? RoleAssignmentStatus.SUSPENDED
              : RoleAssignmentStatus.ACTIVE;
            await manager.save(userRole);
          }
        }

        const application = await manager.findOne(ProfessionalApplication, {
          where: {
            userId: operator.userId,
            requestedRole: ProfessionalRole.PARKING_OPERATOR,
          },
          order: { submittedAt: 'DESC' },
        });
        if (application) {
          application.status = isCurrentlyVerified
            ? ApplicationStatus.REJECTED
            : ApplicationStatus.APPROVED;
          application.rejectionReason = isCurrentlyVerified
            ? 'OPERATOR_SUSPENDED: Facility has been disabled by administrator'
            : null;
          await manager.save(application);
        }
      }

      return manager.save(operator);
    });
  }

  async deleteOperator(id: string): Promise<{ success: boolean; message: string }> {
    return this.dataSource.transaction(async (manager) => {
      const operator = await manager.findOne(ParkingOperator, {
        where: { id },
        relations: { locations: true },
      });
      if (!operator) {
        throw new NotFoundException(`Parking operator ${id} not found`);
      }
      await manager.remove(operator);
      return { success: true, message: 'Parking operator and facilities deleted successfully' };
    });
  }

  async toggleLocationStatus(id: string): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Parking location ${id} not found`);
    }
    location.status =
      location.status === ParkingLocationStatus.ACTIVE
        ? ParkingLocationStatus.INACTIVE
        : ParkingLocationStatus.ACTIVE;
    return this.locationRepo.save(location);
  }

  async deleteLocation(id: string): Promise<{ success: boolean; message: string }> {
    const location = await this.locationRepo.findOne({ where: { id } });
    if (!location) {
      throw new NotFoundException(`Parking location ${id} not found`);
    }
    await this.locationRepo.remove(location);
    return { success: true, message: 'Parking location deleted successfully' };
  }
}
