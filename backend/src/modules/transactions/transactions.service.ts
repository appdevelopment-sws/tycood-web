import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionsDto } from './dto/query-transactions.dto';
import { CreatePayoutDto } from './dto/create-payout.dto';
import {
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from '../../common/enums/transaction.enums';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { ParkingBooking } from '../parking/entities/parking-booking.entity';
import { ParkingLocation } from '../parking/entities/parking-location.entity';
import { ParkingOperator } from '../parking/entities/parking-operator.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { TechnicianBooking } from '../technicians/entities/technician-booking.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { BookingStatus } from '../../common/enums/booking-status.enum';
import { TechnicianBookingStatus } from '../../common/enums/technician-status.enum';
import {
  ParkingBookingStatus,
  ParkingPaymentStatus,
} from '../../common/enums/parking-status.enum';

export interface TransactionSummaryMetrics {
  totalEarnings: number;
  todayEarnings: number;
  totalPayouts: number;
  availableBalance: number;
  totalCount: number;
}

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private readonly transactionRepo: Repository<Transaction>,
    @InjectRepository(ParkingOperator)
    private readonly operatorRepo: Repository<ParkingOperator>,
    @InjectRepository(ParkingLocation)
    private readonly locationRepo: Repository<ParkingLocation>,
    @InjectRepository(ParkingBooking)
    private readonly bookingRepo: Repository<ParkingBooking>,
    @InjectRepository(Booking)
    private readonly cabBookingRepo: Repository<Booking>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
    @InjectRepository(TechnicianBooking)
    private readonly techBookingRepo: Repository<TechnicianBooking>,
    @InjectRepository(TechnicianProfile)
    private readonly techProfileRepo: Repository<TechnicianProfile>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Record a financial transaction. Can run within an existing TypeORM transaction.
   */
  async recordTransaction(
    dto: CreateTransactionDto,
    manager?: EntityManager,
  ): Promise<Transaction> {
    const repo = manager ? manager.getRepository(Transaction) : this.transactionRepo;

    // Check for idempotency if referenceId and category exist
    if (dto.referenceId && dto.category) {
      const existing = await repo.findOne({
        where: {
          userId: dto.userId,
          referenceId: dto.referenceId,
          category: dto.category,
        },
      });
      if (existing) {
        return existing;
      }
    }

    const transaction = repo.create({
      userId: dto.userId,
      role: dto.role,
      type: dto.type,
      category: dto.category,
      amount: dto.amount,
      currency: dto.currency || 'INR',
      status: dto.status || TransactionStatus.COMPLETED,
      referenceId: dto.referenceId,
      referenceType: dto.referenceType,
      title: dto.title,
      description: dto.description,
      paymentMethod: dto.paymentMethod || 'CASH',
      metadata: dto.metadata || {},
    });

    return repo.save(transaction);
  }

  /**
   * Fetch paginated transactions and summary financial metrics for a user/partner
   */
  async getUserTransactions(userId: string, query: QueryTransactionsDto) {
    // 1. Backfill/sync any completed bookings across parking, driver and technician roles
    await this.syncParkingBookingsToTransactions(userId);
    await this.syncDriverBookingsToTransactions(userId);
    await this.syncTechnicianBookingsToTransactions(userId);

    const qb = this.transactionRepo.createQueryBuilder('txn');
    qb.where('txn.userId = :userId', { userId });

    if (query.role) {
      qb.andWhere('txn.role = :role', { role: query.role });
    }

    if (query.type) {
      qb.andWhere('txn.type = :type', { type: query.type });
    }

    if (query.category) {
      qb.andWhere('txn.category = :category', { category: query.category });
    }

    if (query.status) {
      qb.andWhere('txn.status = :status', { status: query.status });
    }

    if (query.startDate) {
      qb.andWhere('txn.createdAt >= :startDate', { startDate: new Date(query.startDate) });
    }

    if (query.endDate) {
      qb.andWhere('txn.createdAt <= :endDate', { endDate: new Date(query.endDate) });
    }

    if (query.search && query.search.trim()) {
      const search = `%${query.search.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(txn.title) LIKE :search OR LOWER(txn.description) LIKE :search OR LOWER(txn.referenceId) LIKE :search OR txn.metadata::text ILIKE :search)',
        { search },
      );
    }

    if (query.locationId) {
      qb.andWhere("txn.metadata->>'locationId' = :locId", { locId: query.locationId });
    }

    // Clone query for computing metrics
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const allTxns = await qb.getMany();

    let totalEarnings = 0;
    let todayEarnings = 0;
    let totalPayouts = 0;

    for (const t of allTxns) {
      const amt = Number(t.amount) || 0;
      if (t.type === TransactionType.CREDIT) {
        totalEarnings += amt;
        if (new Date(t.createdAt) >= startOfToday) {
          todayEarnings += amt;
        }
      } else if (t.type === TransactionType.DEBIT) {
        totalPayouts += amt;
      }
    }

    const availableBalance = Math.max(0, totalEarnings - totalPayouts);

    // Apply pagination
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'DESC';
    qb.orderBy(`txn.${sortBy}`, sortOrder);
    qb.skip(query.skip);
    qb.take(query.limit || 20);

    const [items, total] = await qb.getManyAndCount();

    const metrics: TransactionSummaryMetrics = {
      totalEarnings,
      todayEarnings,
      totalPayouts,
      availableBalance,
      totalCount: total,
    };

    return {
      items,
      meta: {
        page: query.page || 1,
        limit: query.limit || 20,
        total,
        totalPages: Math.ceil(total / (query.limit || 20)),
      },
      metrics,
    };
  }

  /**
   * Request instant payout settlement
   */
  async requestPayout(userId: string, dto: CreatePayoutDto): Promise<Transaction> {
    return this.dataSource.transaction(async (manager) => {
      // Calculate current net available balance
      const transactions = await manager.find(Transaction, {
        where: { userId, status: TransactionStatus.COMPLETED },
      });

      let netBalance = 0;
      for (const t of transactions) {
        if (t.type === TransactionType.CREDIT) {
          netBalance += Number(t.amount);
        } else if (t.type === TransactionType.DEBIT) {
          netBalance -= Number(t.amount);
        }
      }

      if (dto.amount <= 0) {
        throw new BadRequestException('Payout amount must be greater than zero');
      }

      if (dto.amount > netBalance) {
        throw new BadRequestException(
          `Insufficient wallet balance. Requested: ₹${dto.amount}, Available: ₹${netBalance.toFixed(2)}`,
        );
      }

      const balanceAfter = netBalance - dto.amount;

      const payout = manager.create(Transaction, {
        userId,
        role: dto.role || BusinessRole.PARKING_OPERATOR,
        type: TransactionType.DEBIT,
        category: TransactionCategory.PAYOUT,
        amount: dto.amount,
        currency: 'INR',
        status: TransactionStatus.COMPLETED,
        referenceId: `PAYOUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        referenceType: 'PAYOUT_SETTLEMENT',
        title: 'Settlement Payout to Verified Account',
        description: dto.notes || `Settlement transfer via ${dto.paymentMethod || 'Bank Transfer'}. Account: ${dto.accountDetails || 'Linked Partner Account'}`,
        paymentMethod: dto.paymentMethod || 'BANK_TRANSFER',
        metadata: {
          accountDetails: dto.accountDetails,
          requestedAt: new Date().toISOString(),
          instantPayout: true,
        },
        balanceAfter,
      });

      return manager.save(payout);
    });
  }

  /**
   * Helper to ensure all completed/paid parking bookings are registered as transactions
   */
  async syncParkingBookingsToTransactions(operatorUserId: string): Promise<void> {
    try {
      const operator = await this.operatorRepo.findOne({
        where: { userId: operatorUserId },
        relations: { locations: true },
      });

      if (!operator || !operator.locations || operator.locations.length === 0) {
        return;
      }

      const locationIds = operator.locations.map((l) => l.id);
      const bookings = await this.bookingRepo
        .createQueryBuilder('b')
        .where('b.locationId IN (:...locationIds)', { locationIds })
        .andWhere('b.paymentStatus IN (:...statuses)', {
          statuses: [ParkingPaymentStatus.PAID, 'COMPLETED'],
        })
        .getMany();

      for (const b of bookings) {
        const isCompleted = b.status === ParkingBookingStatus.COMPLETED;
        const total = Number(b.totalAmount) || Number(b.providerEarnings) || 0;
        if (total <= 0) continue;

        // Check if already synced
        const exists = await this.transactionRepo.findOne({
          where: {
            userId: operatorUserId,
            referenceId: b.id,
          },
        });

        if (!exists) {
          const loc = operator.locations.find((l) => l.id === b.locationId);
          await this.transactionRepo.save(
            this.transactionRepo.create({
              userId: operatorUserId,
              role: BusinessRole.PARKING_OPERATOR,
              type: TransactionType.CREDIT,
              category: TransactionCategory.PARKING_COLLECTION,
              amount: total,
              currency: 'INR',
              status: TransactionStatus.COMPLETED,
              referenceId: b.id,
              referenceType: 'PARKING_BOOKING',
              title: isCompleted
                ? `Parking Clearance • ${b.vehicleNumber}`
                : `Parking Ticket • ${b.vehicleNumber}`,
              description: `Parking ticket #${b.bookingNumber} (${b.vehicleType}) at ${loc?.name || 'Parking Facility'}`,
              paymentMethod: b.paymentMethod || 'CASH',
              metadata: {
                ticketId: b.bookingNumber,
                bookingId: b.id,
                vehicleNumber: b.vehicleNumber,
                vehicleType: b.vehicleType,
                allocatedBay: b.allocatedBay,
                allocatedFloor: b.allocatedFloor,
                durationHours: b.durationHours,
                advanceAmount: b.advanceAmount,
                remainingAmount: b.remainingAmount,
                locationId: b.locationId,
                locationTitle: loc?.name,
              },
              createdAt: b.actualCheckOutTime || b.actualCheckInTime || b.createdAt,
            }),
          );
        }
      }
    } catch (e) {
      // Non-fatal sync error; log and proceed
      // debugPrint / console.warn
    }
  }

  /**
   * Helper to ensure all completed cab bookings for a driver are registered as transactions
   */
  async syncDriverBookingsToTransactions(driverUserId: string): Promise<void> {
    try {
      const driver = await this.driverProfileRepo.findOne({
        where: { userId: driverUserId },
      });

      const qb = this.cabBookingRepo.createQueryBuilder('b');
      if (driver) {
        qb.where('(b.driverProfileId = :dpId OR b.userId = :userId)', {
          dpId: driver.id,
          userId: driverUserId,
        });
      } else {
        qb.where('b.userId = :userId', { userId: driverUserId });
      }

      const bookings = await qb
        .andWhere('b.status = :status', { status: BookingStatus.COMPLETED })
        .getMany();

      for (const b of bookings) {
        const total = Number(b.totalAmount) || 0;
        if (total <= 0) continue;

        const exists = await this.transactionRepo.findOne({
          where: {
            userId: driverUserId,
            referenceId: b.id,
          },
        });

        if (!exists) {
          const isDriverOfRide = driver && b.driverProfileId === driver.id;
          const driverPayout =
            Number(b.remainingAmount) > 0
              ? Number(b.remainingAmount)
              : Math.round((Number(b.baseFare) || total * 0.8) * 0.8);
          const txnAmount = isDriverOfRide ? (driverPayout > 0 ? driverPayout : total) : total;

          await this.transactionRepo.save(
            this.transactionRepo.create({
              userId: driverUserId,
              role: isDriverOfRide ? BusinessRole.DRIVER : BusinessRole.CUSTOMER,
              type: isDriverOfRide ? TransactionType.CREDIT : TransactionType.DEBIT,
              category: TransactionCategory.RIDE_FARE,
              amount: txnAmount,
              currency: 'INR',
              status: TransactionStatus.COMPLETED,
              referenceId: b.id,
              referenceType: 'CAB_BOOKING',
              title: isDriverOfRide
                ? `Ride Completed • ${b.pickupLocation ? b.pickupLocation.substring(0, 24) : 'Cab Ride'}`
                : `Cab Ride #${b.bookingNumber}`,
              description: `Trip #${b.bookingNumber} (${b.passengerName}) to ${b.dropLocation}`,
              paymentMethod: b.paymentMethod || 'CASH',
              metadata: {
                ticketId: b.bookingNumber,
                bookingId: b.id,
                vehicleNumber: b.cabPlateNumber || '',
                vehicleType: b.cabCategory || 'Cab',
                pickup: b.pickupLocation,
                drop: b.dropLocation,
                passengerName: b.passengerName,
                passengerPhone: b.passengerPhone,
                advanceAmount: b.advanceAmount,
                remainingAmount: b.remainingAmount,
                driverPayout,
              },
              createdAt: b.updatedAt || b.createdAt,
            }),
          );
        }
      }
    } catch {
      // Non-fatal sync error; log and proceed
    }
  }

  /**
   * Helper to ensure all completed technician bookings are registered as transactions
   */
  async syncTechnicianBookingsToTransactions(techUserId: string): Promise<void> {
    try {
      const tech = await this.techProfileRepo.findOne({
        where: { userId: techUserId },
      });

      const qb = this.techBookingRepo.createQueryBuilder('b');
      if (tech) {
        qb.where('(b.technicianProfileId = :tpId OR b.userId = :userId)', {
          tpId: tech.id,
          userId: techUserId,
        });
      } else {
        qb.where('b.userId = :userId', { userId: techUserId });
      }

      const bookings = await qb
        .andWhere('b.status = :status', { status: TechnicianBookingStatus.COMPLETED })
        .getMany();

      for (const b of bookings) {
        const total = Number(b.quotedAmount) || 0;
        if (total <= 0) continue;

        const exists = await this.transactionRepo.findOne({
          where: {
            userId: techUserId,
            referenceId: b.id,
          },
        });

        if (!exists) {
          const isTechOfJob = tech && b.technicianProfileId === tech.id;
          await this.transactionRepo.save(
            this.transactionRepo.create({
              userId: techUserId,
              role: isTechOfJob ? BusinessRole.TECHNICIAN : BusinessRole.CUSTOMER,
              type: isTechOfJob ? TransactionType.CREDIT : TransactionType.DEBIT,
              category: TransactionCategory.TECH_FEE,
              amount: total,
              currency: 'INR',
              status: TransactionStatus.COMPLETED,
              referenceId: b.id,
              referenceType: 'TECHNICIAN_BOOKING',
              title: isTechOfJob
                ? `Job Completed • ${b.issueDescription ? b.issueDescription.substring(0, 24) : 'Roadside Repair'}`
                : `Roadside Assistance #${b.bookingNumber}`,
              description: `Booking #${b.bookingNumber} (${b.vehicleMakeModel || b.vehiclePlateNumber || 'Vehicle'}) at ${b.breakdownLocation}`,
              paymentMethod: 'CASH',
              metadata: {
                ticketId: b.bookingNumber,
                bookingId: b.id,
                vehicleNumber: b.vehiclePlateNumber,
                vehicleType: b.vehicleType,
                issueDescription: b.issueDescription,
                breakdownLocation: b.breakdownLocation,
                advanceAmount: b.advanceAmount,
                remainingAmount: b.remainingAmount,
              },
              createdAt: b.updatedAt || b.createdAt,
            }),
          );
        }
      }
    } catch {
      // Non-fatal sync error; log and proceed
    }
  }
}
