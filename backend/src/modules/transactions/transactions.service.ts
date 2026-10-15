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
    // 1. If role is parking operator or unset, backfill/sync any legacy or existing parking bookings
    await this.syncParkingBookingsToTransactions(userId);

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
}
