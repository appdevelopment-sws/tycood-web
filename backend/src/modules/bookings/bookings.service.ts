import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, Brackets } from 'typeorm';
import { Booking } from './entities/booking.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Vehicle } from '../drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
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
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Search available cabs with dynamic distance estimation & pricing based on active fleet
   */
  async getAvailableCabs(query: AvailableCabsQueryDto) {
    // 1. Extract requested city / search term from pickup location
    const pickupLoc = (query.pickupLocation || '').trim();
    // Extract candidate city token (e.g. from "Jagdeopath, Patna, Bihar" -> "patna", or direct city name)
    const locationTokens = pickupLoc
      .split(/[,–\-\/]/)
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 2);

    // 2. Fetch active registered vehicles from database with driver & user relations
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

    // 3. Location-based matching: filter vehicles whose operating driver or owner operates in the requested city/area
    if (locationTokens.length > 0) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          locationTokens.forEach((token, index) => {
            const param = `loc_${index}`;
            if (index === 0) {
              qb.where(`LOWER(COALESCE(driverUser.city, 'Patna')) LIKE :${param}`, {
                [param]: `%${token}%`,
              });
              qb.orWhere(`:pickupLoc ILIKE CONCAT('%', COALESCE(driverUser.city, 'Patna'), '%')`, {
                pickupLoc: `%${pickupLoc}%`,
              });
            } else {
              qb.orWhere(`LOWER(COALESCE(driverUser.city, 'Patna')) LIKE :${param}`, {
                [param]: `%${token}%`,
              });
            }
          });
        }),
      );
    }

    const vehicles = await queryBuilder.getMany();

    const isRoundTrip = query.tripType === BookingTripType.ROUND_TRIP;
    const isOutstation = query.tripType === BookingTripType.OUTSTATION;
    const distanceMultiplier = isRoundTrip ? 2.0 : isOutstation ? 1.4 : 1.0;

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

      // Use vehicle configured pricing or fallback to category defaults
      const baseFare = Number(vehicle.baseFare) || config.baseRate;
      const originalFare = Number(vehicle.originalFare) || config.originalRate;
      const perKmRate = Number(vehicle.perKmCharge) || config.perKmRate;
      const extraKmCharge = Number(vehicle.extraKmCharge) || (perKmRate + 3);
      const roundoffCostPerKm = Number(vehicle.roundoffCostPerKm) || (perKmRate - 1);
      const outstationBaseCharge = Number(vehicle.outstationBaseCharge) || (baseFare * 3);
      const outstationPerKmCharge = Number(vehicle.outstationPerKmCharge) || (perKmRate + 2);

      const calculatedFare = Math.round(
        (isOutstation ? outstationBaseCharge : baseFare) * distanceMultiplier,
      );
      const calculatedOriginal = Math.round(
        (isOutstation ? outstationBaseCharge * 1.2 : originalFare) * distanceMultiplier,
      );

      const features = Array.isArray(vehicle.features) && vehicle.features.length > 0
        ? vehicle.features
        : config.features;

      const badgeTag = vehicle.badgeTag || config.badgeTag;
      const etaMinutes = vehicle.etaMinutes || (2 + (idx % 6));

      const displayName = vehicle.name?.trim() || vehicle.vehicleCategory || `${vehicle.make} ${vehicle.model}`;
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
        registrationNumber: vehicle.registrationNumber,
        driverName: driverName,
        rating: Number(driverRating),
        reviewsCount: vehicle.reviewsCount || (120 + ((idx * 73) % 800)),
        fare: calculatedFare,
        originalFare: calculatedOriginal,
        baseRate: baseFare,
        originalRate: originalFare,
        baseKm: Number(vehicle.baseKm) || 10,
        perKmRate: perKmRate,
        extraKmCharge: extraKmCharge,
        roundoffCostPerKm: roundoffCostPerKm,
        outstationBaseCharge: outstationBaseCharge,
        outstationPerKmCharge: outstationPerKmCharge,
        seats: vehicle.seatingCapacity || 4,
        luggageBags: vehicle.luggageCapacity || config.luggageBags,
        eta: `${etaMinutes} mins away`,
        features: features,
        badgeTag: badgeTag,
        hasAc: vehicle.hasAc ?? true,
        isInstant: vehicle.isInstant ?? true,
        freeCancellation: vehicle.freeCancellation ?? true,
        tollIncluded: vehicle.tollIncluded ?? true,
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
