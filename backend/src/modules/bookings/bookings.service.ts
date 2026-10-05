import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Booking } from './entities/booking.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Vehicle } from '../drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
import { Tax } from '../taxes/entities/tax.entity.js';
import { TaxType } from '../taxes/enums/tax-type.enum.js';
import { TaxScope } from '../taxes/enums/tax-scope.enum.js';
import { LocationService } from '../location/location.service.js';
import { CreateBookingDto } from './dto/create-booking.dto.js';
import { QueryBookingsDto } from './dto/query-bookings.dto.js';
import { AvailableCabsQueryDto } from './dto/available-cabs-query.dto.js';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto.js';
import { PaginatedResult } from '../../common/dto/pagination.dto.js';
import {
  BookingServiceType,
  BookingStatus,
  BookingTripType,
  PaymentStatus,
  VehicleStatus,
} from '../../common/enums/index.js';

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Tax)
    private readonly taxRepo: Repository<Tax>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly locationService?: LocationService,
  ) {}

  /**
   * Search available cabs with dynamic distance estimation & pricing based on active fleet
   */
  async getAvailableCabs(query: AvailableCabsQueryDto) {
    // 1. Fetch active registered vehicles from database with driver & user relations
    const queryBuilder = this.vehicleRepo
      .createQueryBuilder('vehicle')
      .leftJoinAndSelect('vehicle.driverVehicles', 'dv')
      .leftJoinAndSelect('dv.driverProfile', 'driver')
      .leftJoinAndSelect('driver.user', 'driverUser')
      .where('vehicle.status = :status', { status: VehicleStatus.ACTIVE });

    if (query.category && query.category.trim().toLowerCase() !== 'all') {
      queryBuilder.andWhere('LOWER(vehicle.vehicleCategory) = LOWER(:cat)', {
        cat: query.category.trim(),
      });
    }

    const vehicles = await queryBuilder.getMany();

    // 2. Resolve distance in kilometers from query or via LocationService
    let resolvedDistanceKm = 0;
    if (query.distanceKm && Number(query.distanceKm) > 0) {
      resolvedDistanceKm = Number(query.distanceKm);
    } else if (
      this.locationService &&
      query.pickupLocation &&
      query.dropLocation &&
      query.pickupLocation.trim().length > 0 &&
      query.dropLocation.trim().length > 0
    ) {
      try {
        const distResult = await this.locationService.calculateDistance({
          origin: query.pickupLocation,
          destination: query.dropLocation,
          originLat:
            query.pickupLat !== undefined ? Number(query.pickupLat) : undefined,
          originLng:
            query.pickupLng !== undefined ? Number(query.pickupLng) : undefined,
          destLat:
            query.dropLat !== undefined ? Number(query.dropLat) : undefined,
          destLng:
            query.dropLng !== undefined ? Number(query.dropLng) : undefined,
        });
        const distKm =
          distResult?.distance?.kilometers ||
          (distResult?.distance?.value ? distResult.distance.value / 1000 : 0);
        if (distKm > 0) {
          resolvedDistanceKm = Math.round(distKm * 10) / 10;
        }
      } catch (err) {
        this.logger.warn(
          `Failed to resolve distance via locationService: ${err}`,
        );
      }
    }

    // Sensible fallback distance if coordinates/places could not resolve distance
    if (!resolvedDistanceKm || resolvedDistanceKm <= 0) {
      resolvedDistanceKm =
        query.tripType === BookingTripType.OUTSTATION ? 120 : 25;
    }

    const isRoundTrip =
      query.tripType === BookingTripType.ROUND_TRIP ||
      Boolean(query.returnDate && query.returnDate.trim().length > 0);
    const isOutstation =
      query.tripType === BookingTripType.OUTSTATION || resolvedDistanceKm > 75;

    // For round trips, vehicle travels both ways (outbound + return)
    const totalBillableKm = isRoundTrip
      ? Math.round(resolvedDistanceKm * 2 * 10) / 10
      : Math.round(resolvedDistanceKm * 10) / 10;

    // Trip characteristics for conditional taxes and surcharges
    const isAirportRide =
      /airport|aerodrome|terminal|t1|t2|t3/i.test(query.pickupLocation || '') ||
      /airport|aerodrome|terminal|t1|t2|t3/i.test(query.dropLocation || '') ||
      (query as any).isAirportRide === true ||
      (query as any).serviceType === 'AIRPORT';

    const scheduledDate = query.startDate ? new Date(query.startDate) : new Date();
    const scheduledHour = scheduledDate.getHours();
    // Night ride window: 23:00 (11 PM) to 05:00 (5 AM)
    const isNightRide = scheduledHour >= 23 || scheduledHour < 5;

    // 3. Fetch active taxes and surcharges from database
    let activeTaxes: Tax[] = [];
    try {
      activeTaxes = await this.taxRepo.find({
        where: { isActive: true },
        order: { priority: 'ASC' },
      });
    } catch (e) {
      this.logger.warn(`Could not load taxes from DB: ${e}`);
    }

    // Helper category configurations for default specs/rates when not customized per-vehicle
    const categoryDefaults: Record<
      string,
      {
        baseRate: number;
        originalRate: number;
        perKmRate: number;
        luggageBags: number;
        badgeTag: string;
        features: string[];
      }
    > = {
      Sedan: {
        baseRate: 649,
        originalRate: 799,
        perKmRate: 14.5,
        luggageBags: 2,
        badgeTag: 'BEST VALUE',
        features: [
          'AC Included',
          'Clean Cab',
          'Top Rated Driver',
          'Toll Included',
          'Free Cancellation',
        ],
      },
      'SUV / XL': {
        baseRate: 1199,
        originalRate: 1399,
        perKmRate: 21.0,
        luggageBags: 4,
        badgeTag: 'SPACIOUS',
        features: [
          'Captain Seats',
          'Dual AC',
          'Toll & Parking Included',
          'Luggage Carrier',
          'Water Bottles',
        ],
      },
      Hatchback: {
        baseRate: 499,
        originalRate: 599,
        perKmRate: 12.0,
        luggageBags: 1,
        badgeTag: 'FASTEST',
        features: [
          'Compact & Fast',
          'AC Included',
          'Best City Commute',
          'Instant Dispatch',
        ],
      },
      'Electric (EV)': {
        baseRate: 549,
        originalRate: 649,
        perKmRate: 13.0,
        luggageBags: 2,
        badgeTag: 'ECO-FRIENDLY',
        features: [
          '100% Electric',
          'Silent Cabin',
          'Zero Emission',
          'AC Included',
        ],
      },
      Luxury: {
        baseRate: 2499,
        originalRate: 2899,
        perKmRate: 35.0,
        luggageBags: 5,
        badgeTag: 'LUXURY',
        features: [
          'VIP Chauffeur in Uniform',
          'Complimentary Wi-Fi',
          'Leather Seating',
          'Refreshments Included',
        ],
      },
    };

    return vehicles.map((vehicle, idx) => {
      const category = vehicle.vehicleCategory || 'Sedan';
      const config = categoryDefaults[category] || categoryDefaults['Sedan'];

      const assignedDriver = vehicle.driverVehicles?.[0]?.driverProfile;
      const driverName = assignedDriver?.user?.name || 'Verified Partner Driver';
      const driverRating = vehicle.rating || 4.8;

      // Base rates and charges configured on vehicle or category fallback
      const baseFare = Number(vehicle.baseFare) || config.baseRate;
      const originalFare = Number(vehicle.originalFare) || config.originalRate;
      const perKmRate = Number(vehicle.perKmCharge) || config.perKmRate;
      const extraKmCharge = Number(vehicle.extraKmCharge) || (perKmRate + 3);
      const roundoffCostPerKm =
        Number(vehicle.roundoffCostPerKm) || Math.max(10, perKmRate - 1.5);
      const outstationBaseCharge =
        Number(vehicle.outstationBaseCharge) || Math.round(baseFare * 2.0);
      const outstationPerKmCharge =
        Number(vehicle.outstationPerKmCharge) || Math.round((perKmRate + 2) * 10) / 10;

      // Effective Per-Km Rate
      const effectivePerKmRate = isRoundTrip
        ? roundoffCostPerKm // Discounted round-trip per-km rate
        : isOutstation
          ? outstationPerKmCharge
          : perKmRate;

      // Distance Charge: Direct (totalBillableKm * perKmRate) without deducting base km
      const distanceCharge = Math.round(totalBillableKm * effectivePerKmRate);

      // Outstation extra charge if outstation trip
      const outstationExtraCharge = isOutstation ? outstationBaseCharge : 0;

      // Subtotal = Base Fare + (Distance * Rate) + Outstation Charge
      const subtotal = Math.round(baseFare + distanceCharge + outstationExtraCharge);

      // Dynamic Taxes (e.g. GST 5% from system settings/tax table)
      const appliedTaxes: Array<{
        name: string;
        code: string;
        rate: number;
        taxType: TaxType;
        applicableOn: TaxScope;
        amount: number;
      }> = [];
      let totalTaxAmount = 0;

      if (activeTaxes.length > 0) {
        for (const tax of activeTaxes) {
          const appliesToTrip =
            tax.applicableOn === TaxScope.ALL_RIDES ||
            (tax.applicableOn === TaxScope.OUTSTATION && isOutstation) ||
            (tax.applicableOn === TaxScope.INTERCITY_ONLY && isOutstation) ||
            (tax.applicableOn === TaxScope.AIRPORT_RIDES && isAirportRide) ||
            (tax.applicableOn === TaxScope.NIGHT_RIDES && isNightRide);

          if (appliesToTrip) {
            let taxAmt = 0;
            if (tax.taxType === TaxType.PERCENTAGE) {
              taxAmt = Math.round((subtotal * Number(tax.rate)) / 100);
            } else {
              taxAmt = Math.round(Number(tax.rate));
            }
            totalTaxAmount += taxAmt;
            appliedTaxes.push({
              name: tax.name,
              code: tax.code,
              rate: Number(tax.rate),
              taxType: tax.taxType,
              applicableOn: tax.applicableOn,
              amount: taxAmt,
            });
          }
        }
      } else {
        // Fallback standard transport GST (5%)
        const defaultGst = Math.round(subtotal * 0.05);
        totalTaxAmount = defaultGst;
        appliedTaxes.push({
          name: 'Goods & Services Tax (GST 5%)',
          code: 'GST_5',
          rate: 5,
          taxType: TaxType.PERCENTAGE,
          applicableOn: TaxScope.ALL_RIDES,
          amount: defaultGst,
        });
      }

      // Final Total Calculated Fare & MRP/Original Fare before discount
      const calculatedFare = Math.round(subtotal + totalTaxAmount);
      const calculatedOriginal = Math.round(
        (subtotal * 1.15) + totalTaxAmount,
      );

      const vehicleHasAc =
        vehicle.hasAc === false || (vehicle.hasAc as any) === 0 || (vehicle.hasAc as any) === 'false'
          ? false
          : vehicle.hasAc === true || (vehicle.hasAc as any) === 1 || (vehicle.hasAc as any) === 'true'
          ? true
          : true;

      const rawFeatures =
        Array.isArray(vehicle.features) && vehicle.features.length > 0
          ? vehicle.features
          : config.features;

      const sanitizedFeatures = vehicleHasAc
        ? rawFeatures
        : rawFeatures.filter((f: string) => !f.toLowerCase().includes('ac'));

      const badgeTag = vehicle.badgeTag || config.badgeTag;
      const etaMinutes = vehicle.etaMinutes || (2 + (idx % 6));

      const displayName =
        vehicle.name?.trim() ||
        vehicle.vehicleCategory ||
        `${vehicle.make} ${vehicle.model}`;
      const similarHint = vehicle.similarModels?.trim()
        ? `${vehicle.similarModels}`
        : `${category} or similar`;
      const modelSubtitle = `${similarHint} • ${vehicle.seatingCapacity} Seats`;

      return {
        id: vehicle.id,
        vehicleId: vehicle.id,
        name: displayName,
        category: category,
        similarModels: vehicle.similarModels || similarHint,
        modelSubtitle: modelSubtitle,
        imageAsset: vehicle.imageUrl || 'assets/car.png',
        imageUrl: vehicle.imageUrl || 'assets/car.png',
        registrationNumber: vehicle.registrationNumber,
        driverName: driverName,
        rating: Number(driverRating),
        reviewsCount: vehicle.reviewsCount || (120 + ((idx * 73) % 800)),
        fare: calculatedFare,
        originalFare: calculatedOriginal,
        baseRate: baseFare,
        originalRate: originalFare,
        baseKm: 0,
        perKmRate: effectivePerKmRate,
        extraKmCharge: extraKmCharge,
        roundoffCostPerKm: roundoffCostPerKm,
        outstationBaseCharge: outstationBaseCharge,
        outstationPerKmCharge: outstationPerKmCharge,
        outstationExtraCharge: outstationExtraCharge,
        distanceKm: resolvedDistanceKm,
        totalBillableKm: totalBillableKm,
        extraKm: totalBillableKm,
        distanceCharge: distanceCharge,
        subtotal: subtotal,
        taxAmount: totalTaxAmount,
        taxes: appliedTaxes,
        isRoundTrip: isRoundTrip,
        isOutstation: isOutstation,
        seats: vehicle.seatingCapacity || 4,
        luggageBags: vehicle.luggageCapacity || config.luggageBags,
        eta: `${etaMinutes} mins away`,
        features: sanitizedFeatures,
        badgeTag: badgeTag,
        hasAc: vehicleHasAc,
        isInstant: vehicle.isInstant ?? true,
        freeCancellation: vehicle.freeCancellation ?? true,
        tollIncluded: vehicle.tollIncluded ?? true,
        fareBreakdown: {
          tripType: query.tripType,
          isRoundTrip: isRoundTrip,
          isOutstation: isOutstation,
          isAirportRide: isAirportRide,
          isNightRide: isNightRide,
          oneWayKm: resolvedDistanceKm,
          totalBillableKm: totalBillableKm,
          baseFare: baseFare,
          perKmRate: effectivePerKmRate,
          distanceCharge: distanceCharge,
          outstationCharge: outstationExtraCharge,
          subtotal: subtotal,
          taxes: appliedTaxes,
          totalTaxes: totalTaxAmount,
          totalFare: calculatedFare,
          tollIncluded: vehicle.tollIncluded ?? true,
        },
      };
    });
  }

  /**
   * Create a new booking with ACID transaction
   */
  async createBooking(userId: string, dto: CreateBookingDto): Promise<Booking> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Generate unique human-readable booking number: #CAB-xxxxx or #PRK-xxxxx
      const prefix =
        dto.serviceType === BookingServiceType.PARKING
          ? '#PRK'
          : dto.serviceType === BookingServiceType.TECHNICIAN
            ? '#MEC'
            : '#CAB';
      const randomDigits = Math.floor(10000 + Math.random() * 90000);
      const bookingNumber = `${prefix}-${randomDigits}`;

      // 2. Generate 4-digit security OTP
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      // 3. Resolve vehicle & driver details
      let vehicleId: string | null = null;
      let driverProfileId: string | null = null;
      let driverName = 'Ramesh Kumar';
      let driverPhone = '+91 98351 24789';
      let driverRating = 4.9;
      let cabPlateNumber = dto.cabPlateNumber || 'BR 01 EA 4521';
      let cabName = dto.cabName || 'Maruti Suzuki Dzire';
      let cabCategory = dto.cabCategory || 'Sedan';

      if (dto.cabId) {
        const vehicle = await queryRunner.manager.findOne(Vehicle, {
          where: { id: dto.cabId },
          relations: {
            driverVehicles: {
              driverProfile: {
                user: true,
              },
            },
          },
        });
        if (vehicle) {
          vehicleId = vehicle.id;
          cabPlateNumber = vehicle.registrationNumber;
          cabName = `${vehicle.make} ${vehicle.model}`;
          cabCategory = vehicle.vehicleCategory;
          const assignedDriver = vehicle.driverVehicles?.[0]?.driverProfile;
          if (assignedDriver) {
            driverProfileId = assignedDriver.id;
            if (assignedDriver.user) {
              driverName = assignedDriver.user.name;
              driverPhone = assignedDriver.user.phone || driverPhone;
            }
          }
        }
      }

      // 4. Create booking entity
      const passengerName =
        dto.passengerName?.trim() || user.name || 'Rahul Kumar';
      const passengerPhone =
        dto.passengerPhone?.trim() || user.phone || '+91 98765 43210';

      const booking = queryRunner.manager.create(Booking, {
        bookingNumber,
        userId: user.id,
        serviceType: dto.serviceType || BookingServiceType.CAB,
        status: BookingStatus.ACTIVE,
        tripType: dto.tripType || BookingTripType.ONE_WAY,
        pickupLocation: dto.pickupLocation,
        dropLocation: dto.dropLocation,
        intermediateStop: dto.intermediateStop || null,
        scheduledDateTime: new Date(dto.scheduledDateTime),
        returnDateTime: dto.returnDateTime ? new Date(dto.returnDateTime) : null,
        baseFare: dto.baseFare,
        platformFee: dto.platformFee ?? 49,
        discountAmount: dto.discountAmount ?? 0,
        totalAmount: dto.totalAmount,
        paymentMethod: dto.paymentMethod || 'UPI',
        paymentStatus: PaymentStatus.COMPLETED,
        passengerName,
        passengerPhone,
        pickupNotes: dto.pickupNotes || null,
        otp,
        vehicleId,
        driverProfileId,
        cabName,
        cabCategory,
        cabPlateNumber,
        driverName,
        driverPhone,
        driverRating,
        metadata: {
          ...dto.metadata,
          appliedCoupon: dto.appliedCoupon || null,
          appliedTaxes: dto.metadata?.appliedTaxes || [],
          fareBreakdown: dto.metadata?.fareBreakdown || {
            baseFare: dto.baseFare,
            totalAmount: dto.totalAmount,
            platformFee: dto.platformFee ?? 49,
            discountAmount: dto.discountAmount ?? 0,
            appliedTaxes: dto.metadata?.appliedTaxes || [],
            distanceKm: dto.metadata?.distanceKm || 0,
            distanceCharge: dto.metadata?.distanceCharge || 0,
          },
        },
      });

      const savedBooking = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Created booking ${savedBooking.bookingNumber} for user ${user.id} (${passengerName})`,
      );

      return savedBooking;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create booking: ${err.message}`, err.stack);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Retrieve bookings for the authenticated user with filtering, searching, and pagination
   */
  async getMyBookings(
    userId: string,
    queryDto: QueryBookingsDto,
  ): Promise<PaginatedResult<Booking>> {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .where('booking.user_id = :userId', { userId });

    if (queryDto.serviceType) {
      qb.andWhere('booking.service_type = :serviceType', {
        serviceType: queryDto.serviceType,
      });
    }

    if (queryDto.status) {
      qb.andWhere('booking.status = :status', { status: queryDto.status });
    }

    if (queryDto.search?.trim()) {
      const searchTerm = `%${queryDto.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(booking.booking_number) LIKE :searchTerm OR LOWER(booking.pickup_location) LIKE :searchTerm OR LOWER(booking.drop_location) LIKE :searchTerm OR LOWER(booking.cab_name) LIKE :searchTerm OR LOWER(booking.driver_name) LIKE :searchTerm)',
        { searchTerm },
      );
    }

    qb.orderBy('booking.created_at', 'DESC');
    qb.skip(queryDto.skip);
    qb.take(queryDto.limit || 10);

    const [data, total] = await qb.getManyAndCount();
    const limit = queryDto.limit || 10;
    const page = queryDto.page || 1;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Retrieve single booking by ID or bookingNumber
   */
  async getBookingById(id: string, userId: string): Promise<Booking> {
    const qb = this.bookingRepo
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.vehicle', 'vehicle')
      .leftJoinAndSelect('booking.driverProfile', 'driverProfile')
      .where(
        '(booking.id = :id OR booking.booking_number = :id) AND booking.user_id = :userId',
        { id, userId },
      );

    const booking = await qb.getOne();
    if (!booking) {
      throw new NotFoundException(`Booking not found`);
    }

    return booking;
  }

  /**
   * Cancel an active or upcoming booking
   */
  async cancelBooking(
    id: string,
    userId: string,
    reason: string,
  ): Promise<Booking> {
    const booking = await this.getBookingById(id, userId);

    if (
      booking.status !== BookingStatus.ACTIVE &&
      booking.status !== BookingStatus.UPCOMING
    ) {
      throw new BadRequestException(
        `Cannot cancel booking with status ${booking.status}. Only ACTIVE or UPCOMING bookings can be cancelled.`,
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      booking.status = BookingStatus.CANCELLED;
      booking.cancellationReason = reason;
      booking.cancelledAt = new Date();

      const saved = await queryRunner.manager.save(Booking, booking);
      await queryRunner.commitTransaction();

      this.logger.log(
        `Booking ${booking.bookingNumber} was cancelled by user ${userId}. Reason: ${reason}`,
      );

      return saved;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to cancel booking: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Update booking status (used by dispatchers, drivers, or admins)
   */
  async updateStatus(
    id: string,
    dto: UpdateBookingStatusDto,
  ): Promise<Booking> {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    // Verify OTP if starting or completing trip
    if (dto.status === BookingStatus.ACTIVE && dto.otp && dto.otp !== booking.otp) {
      throw new BadRequestException('Invalid start ride OTP code');
    }

    booking.status = dto.status;
    return this.bookingRepo.save(booking);
  }
}
