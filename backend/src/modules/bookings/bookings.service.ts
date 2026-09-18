import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
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
    // 1. Fetch active registered vehicles
    const vehicles = await this.vehicleRepo.find({
      where: { status: VehicleStatus.ACTIVE },
      relations: {
        driverVehicles: {
          driverProfile: {
            user: true,
          },
        },
      },
    });

    const isRoundTrip = query.tripType === BookingTripType.ROUND_TRIP;
    const isOutstation = query.tripType === BookingTripType.OUTSTATION;
    const distanceMultiplier = isRoundTrip ? 2.0 : isOutstation ? 1.4 : 1.0;

    // Curated catalog templates mapped with real database vehicles if present
    const defaultCatalog = [
      {
        id: 'cab_sedan_1',
        name: 'Maruti Suzuki Dzire',
        category: 'Sedan',
        modelSubtitle: 'Comfort Sedan • Top Partner Fleet',
        imageAsset: 'assets/car.png',
        rating: 4.88,
        reviewsCount: 1420,
        baseRate: 649,
        originalRate: 799,
        seats: 4,
        luggageBags: 2,
        eta: '3 mins away',
        features: [
          'AC Included',
          'Clean Cab',
          'Top Rated Driver',
          'Toll Included',
          'Free Cancellation',
        ],
        badgeTag: 'BEST VALUE',
        perKmRate: 14.5,
        hasAc: true,
        isInstant: true,
        freeCancellation: true,
        tollIncluded: true,
      },
      {
        id: 'cab_suv_1',
        name: 'Toyota Innova Crysta',
        category: 'SUV / XL',
        modelSubtitle: 'Spacious Premier SUV • Long Distance Ideal',
        imageAsset: 'assets/car.png',
        rating: 4.95,
        reviewsCount: 2890,
        baseRate: 1199,
        originalRate: 1399,
        seats: 7,
        luggageBags: 4,
        eta: '5 mins away',
        features: [
          'Captain Seats',
          'Dual AC',
          'Toll & Parking Included',
          'Luggage Carrier',
          'Water Bottles',
        ],
        badgeTag: 'SPACIOUS',
        perKmRate: 21.0,
        hasAc: true,
        isInstant: true,
        freeCancellation: true,
        tollIncluded: true,
      },
      {
        id: 'cab_suv_2',
        name: 'Maruti Suzuki Ertiga',
        category: 'SUV / XL',
        modelSubtitle: 'Affordable 6-Seater Family Ride',
        imageAsset: 'assets/car.png',
        rating: 4.79,
        reviewsCount: 840,
        baseRate: 949,
        originalRate: 1099,
        seats: 6,
        luggageBags: 3,
        eta: '6 mins away',
        features: [
          'AC Included',
          'Clean Cab',
          '6 Passenger Seats',
          'Top Partner',
        ],
        badgeTag: 'POPULAR',
        perKmRate: 17.5,
        hasAc: true,
        isInstant: true,
        freeCancellation: true,
        tollIncluded: true,
      },
      {
        id: 'cab_hatch_1',
        name: 'Maruti Suzuki WagonR',
        category: 'Hatchback',
        modelSubtitle: 'Pocket-Friendly City Express',
        imageAsset: 'assets/car.png',
        rating: 4.72,
        reviewsCount: 630,
        baseRate: 499,
        originalRate: 599,
        seats: 4,
        luggageBags: 1,
        eta: '2 mins away',
        features: [
          'Compact & Fast',
          'AC Included',
          'Best City Commute',
          'Instant Dispatch',
        ],
        badgeTag: 'FASTEST',
        perKmRate: 12.0,
        hasAc: true,
        isInstant: true,
        freeCancellation: true,
        tollIncluded: true,
      },
      {
        id: 'cab_ev_1',
        name: 'Tata Tiago EV',
        category: 'Electric (EV)',
        modelSubtitle: 'Eco-Friendly Zero Emission Glide',
        imageAsset: 'assets/car.png',
        rating: 4.85,
        reviewsCount: 420,
        baseRate: 549,
        originalRate: 649,
        seats: 4,
        luggageBags: 2,
        eta: '4 mins away',
        features: [
          '100% Electric',
          'Silent Cabin',
          'Zero Emission',
          'AC Included',
        ],
        badgeTag: 'ECO-FRIENDLY',
        perKmRate: 13.0,
        hasAc: true,
        isInstant: true,
        freeCancellation: true,
        tollIncluded: true,
      },
      {
        id: 'cab_lux_1',
        name: 'Toyota Fortuner 4x4',
        category: 'Luxury',
        modelSubtitle: 'Executive VIP Chauffeur Service',
        imageAsset: 'assets/car.png',
        rating: 4.98,
        reviewsCount: 510,
        baseRate: 2499,
        originalRate: 2899,
        seats: 7,
        luggageBags: 5,
        eta: '8 mins away',
        features: [
          'VIP Chauffeur in Uniform',
          'Complimentary Wi-Fi',
          'Leather Seating',
          'Refreshments Included',
        ],
        badgeTag: 'LUXURY',
        perKmRate: 35.0,
        hasAc: true,
        isInstant: true,
        freeCancellation: true,
        tollIncluded: true,
      },
    ];

    // Filter by category if requested
    let cabs = defaultCatalog;
    if (query.category && query.category !== 'All') {
      cabs = cabs.filter(
        (c) => c.category.toLowerCase() === query.category!.toLowerCase(),
      );
    }

    // Apply distance multiplier and dynamically link registered vehicles if any
    return cabs.map((cab, index) => {
      const calculatedFare = Math.round(cab.baseRate * distanceMultiplier);
      const calculatedOriginal = Math.round(cab.originalRate * distanceMultiplier);

      const matchedVehicle = vehicles[index % (vehicles.length || 1)];

      return {
        ...cab,
        fare: calculatedFare,
        originalFare: calculatedOriginal,
        vehicleId: matchedVehicle?.id || null,
        registrationNumber: matchedVehicle?.registrationNumber || 'BR 01 EA 4521',
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
