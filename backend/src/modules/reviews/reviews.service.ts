import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Review } from './entities/review.entity.js';
import { User } from '../users/entities/user.entity.js';
import { Booking } from '../bookings/entities/booking.entity.js';
import { TechnicianBooking } from '../technicians/entities/technician-booking.entity.js';
import { ParkingBooking } from '../parking/entities/parking-booking.entity.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { QueryReviewsDto } from './dto/query-reviews.dto.js';
import { ReviewTargetType } from '../../common/enums/index.js';

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Submit a new rating & review
   */
  async createReview(dto: CreateReviewDto, reviewerId: string): Promise<{ review: Review; summary: any }> {
    // 1. Check for duplicate review on the same booking by the same reviewer
    if (dto.bookingId) {
      const existing = await this.reviewRepo.findOne({
        where: {
          bookingId: dto.bookingId,
          reviewerId,
        },
      });

      if (existing) {
        throw new ConflictException('You have already submitted a review for this booking.');
      }
    }

    // Normalize targetType if aliases were passed
    let targetType = dto.targetType || ReviewTargetType.USER;
    const rawType = String(dto.targetType || '').toUpperCase();
    if (rawType === 'DRIVER') {
      targetType = ReviewTargetType.USER;
    } else if (rawType === 'PARKING_LOT') {
      targetType = ReviewTargetType.PARKING_LOCATION;
    } else if (rawType === 'TECHNICIAN') {
      targetType = ReviewTargetType.USER;
    }

    // Helper to validate UUID format
    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    // Resolve targetId to a valid UUID
    let targetId: string = dto.targetId || '';

    // Check if bookingId is a UUID or a bookingNumber (e.g. PRK-..., TRP-..., MEC-...)
    const isBookingUuid = dto.bookingId ? isUuid(dto.bookingId) : false;
    const bookingWhere = isBookingUuid
      ? [{ id: dto.bookingId }, { bookingNumber: dto.bookingId }]
      : [{ bookingNumber: dto.bookingId }];

    // 2. Perform write inside an atomic transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // If targetId is not a valid UUID and bookingId is given, resolve it from the booking entity
      if (!isUuid(targetId) && dto.bookingId) {
        // Check Cab Booking
        try {
          const cab = await this.bookingRepo.findOne({
            where: bookingWhere as any,
          });
          if (cab) {
            if (cab.driverProfileId && isUuid(cab.driverProfileId)) {
              targetId = cab.driverProfileId;
            } else if (cab.userId && isUuid(cab.userId) && reviewerId !== cab.userId) {
              targetId = cab.userId;
            }
          }
        } catch (_) {}

        // Check Technician Booking
        if (!isUuid(targetId)) {
          try {
            const cleanBId = dto.bookingId.trim().replace(/^#/, '');
            const withHash = `#${cleanBId}`;
            const qb = queryRunner.manager
              .createQueryBuilder(TechnicianBooking, 'tb')
              .leftJoinAndSelect('tb.technicianProfile', 'tp');
            if (isBookingUuid) {
              qb.where(
                'tb.id = :id OR tb.booking_number = :id OR tb.booking_number = :cleanBId OR tb.booking_number = :withHash',
                { id: dto.bookingId, cleanBId, withHash },
              );
            } else {
              qb.where(
                'tb.booking_number = :cleanBId OR tb.booking_number = :withHash OR tb.id = :cleanBId',
                { cleanBId, withHash },
              );
            }
            const techBooking = await qb.getOne();
            if (techBooking) {
              if (techBooking.technicianProfile?.userId && isUuid(techBooking.technicianProfile.userId)) {
                targetId = techBooking.technicianProfile.userId;
              } else if (techBooking.technicianProfileId && isUuid(techBooking.technicianProfileId)) {
                targetId = techBooking.technicianProfileId;
              } else if (techBooking.userId && isUuid(techBooking.userId) && reviewerId !== techBooking.userId) {
                targetId = techBooking.userId;
              }
            }
          } catch (_) {}
        }

        // Check Parking Booking
        if (!isUuid(targetId)) {
          try {
            const qb = queryRunner.manager.createQueryBuilder(ParkingBooking, 'pb');
            if (isBookingUuid) {
              qb.where('pb.id = :id OR pb.booking_number = :id', { id: dto.bookingId });
            } else {
              qb.where('pb.booking_number = :id', { id: dto.bookingId });
            }
            const parkBooking = await qb.getOne();
            if (parkBooking && parkBooking.locationId && isUuid(parkBooking.locationId)) {
              targetId = parkBooking.locationId;
            }
          } catch (_) {}
        }
      }

      // Fallback: If still not a valid UUID, use a standard UUID so postgres uuid column is satisfied
      if (!isUuid(targetId)) {
        targetId = '00000000-0000-0000-0000-000000000000';
      }

      const review = this.reviewRepo.create({
        ...dto,
        targetType,
        targetId,
        reviewerId,
        tags: dto.tags || [],
      });

      const savedReview = await queryRunner.manager.save(Review, review);

      // 3. If target is a USER, update User profile rating if target exists in User table
      if (
        (targetType === ReviewTargetType.USER || rawType === 'DRIVER' || rawType === 'TECHNICIAN') &&
        targetId !== '00000000-0000-0000-0000-000000000000'
      ) {
        const userExists = await queryRunner.manager.findOne(User, { where: { id: targetId } });
        if (userExists) {
          const stats = await queryRunner.manager
            .createQueryBuilder(Review, 'r')
            .select('ROUND(AVG(r.rating)::numeric, 2)', 'avgRating')
            .addSelect('COUNT(r.id)', 'totalCount')
            .where('r.target_id = :targetId', { targetId })
            .andWhere('r.target_type = :targetType', { targetType: ReviewTargetType.USER })
            .getRawOne();

          const avgRating = stats?.avgRating ? parseFloat(stats.avgRating) : dto.rating;
          const totalCount = stats?.totalCount ? parseInt(stats.totalCount, 10) : 1;

          await queryRunner.manager.update(User, targetId, {
            passengerRating: avgRating,
            passengerReviewsCount: totalCount,
          });
        }
      }

      // 4. Update booking snapshot metadata across Cab, Parking, or Technician bookings
      if (dto.bookingId) {
        // Cab booking
        try {
          const booking = await queryRunner.manager.findOne(Booking, {
            where: bookingWhere as any,
          });

          if (booking) {
            booking.metadata = {
              ...(booking.metadata || {}),
              lastReviewedAt: new Date().toISOString(),
              reviewRating: dto.rating,
              reviewTags: dto.tags || [],
              reviewComment: dto.comment || null,
            };
            await queryRunner.manager.save(Booking, booking);
          }
        } catch (_) {}

        // Parking booking
        try {
          const parkBooking = await queryRunner.manager.findOne(ParkingBooking, {
            where: bookingWhere as any,
          });
          if (parkBooking) {
            parkBooking.metadata = {
              ...(parkBooking.metadata || {}),
              lastReviewedAt: new Date().toISOString(),
              reviewRating: dto.rating,
              reviewTags: dto.tags || [],
              reviewComment: dto.comment || null,
            };
            await queryRunner.manager.save(ParkingBooking, parkBooking);
          }
        } catch (_) {}

        // Technician booking
        try {
          const techBooking = await queryRunner.manager.findOne(TechnicianBooking, {
            where: bookingWhere as any,
          });
          if (techBooking) {
            techBooking.customerNotes = [
              techBooking.customerNotes,
              `[Review ${dto.rating}★]: ${dto.comment || dto.tags?.join(', ') || 'Service rated'}`,
            ].filter(Boolean).join('\n');
            await queryRunner.manager.save(TechnicianBooking, techBooking);
          }
        } catch (_) {}
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Review created: ID=${savedReview.id}, Rating=${dto.rating}, Target=${targetId}`,
      );

      const summary = await this.getTargetSummary(targetId, targetType);
      return { review: savedReview, summary };
    } catch (error: any) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Error saving review: ${error?.message || error}`, error?.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get rating summary, distribution, and top tags for a given target entity or user
   */
  async getTargetSummary(targetId: string, targetType?: ReviewTargetType) {
    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    if (!isUuid(targetId)) {
      return {
        targetId,
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topTags: [],
        recentReviews: [],
      };
    }

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .where('r.target_id = :targetId', { targetId });

    if (targetType) {
      qb.andWhere('r.target_type = :targetType', { targetType });
    }

    const reviews = await qb
      .orderBy('r.createdAt', 'DESC')
      .take(50)
      .getMany();

    const totalReviews = reviews.length;
    if (totalReviews === 0) {
      return {
        targetId,
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        topTags: [],
        recentReviews: [],
      };
    }

    let sum = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const tagCounts: Record<string, number> = {};

    for (const r of reviews) {
      sum += r.rating;
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      if (Array.isArray(r.tags)) {
        for (const t of r.tags) {
          if (t && t.trim()) {
            tagCounts[t] = (tagCounts[t] || 0) + 1;
          }
        }
      }
    }

    const averageRating = parseFloat((sum / totalReviews).toFixed(1));
    const topTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    return {
      targetId,
      averageRating,
      totalReviews,
      distribution,
      topTags,
      recentReviews: reviews.slice(0, 5),
    };
  }

  /**
   * Get partner rating summary for currently authenticated user
   */
  async getMySummary(userId: string) {
    const isUuid = (val?: string) =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

    if (!isUuid(userId)) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: [],
      };
    }

    const targetIds: string[] = [userId];

    try {
      const techProfile = await this.dataSource.query(
        `SELECT id FROM technician_profiles WHERE user_id = $1`,
        [userId],
      );
      if (techProfile?.length > 0) {
        for (const tp of techProfile) {
          if (tp.id) targetIds.push(tp.id);
        }
      }
    } catch (_) {}

    try {
      const driverProfile = await this.dataSource.query(
        `SELECT id FROM driver_profiles WHERE user_id = $1`,
        [userId],
      );
      if (driverProfile?.length > 0) {
        for (const dp of driverProfile) {
          if (dp.id) targetIds.push(dp.id);
        }
      }
    } catch (_) {}

    try {
      const vehicles = await this.dataSource.query(
        `SELECT id FROM vehicles WHERE user_id = $1`,
        [userId],
      );
      if (vehicles?.length > 0) {
        for (const v of vehicles) {
          if (v.id) targetIds.push(v.id);
        }
      }
    } catch (_) {}

    const reviews = await this.reviewRepo
      .createQueryBuilder('r')
      .where(
        '(r.target_id IN (:...targetIds) OR r.booking_id IN (SELECT booking_number FROM technician_bookings WHERE technician_profile_id IN (:...targetIds)) OR r.booking_id IN (SELECT id::text FROM technician_bookings WHERE technician_profile_id IN (:...targetIds)) OR r.booking_id IN (SELECT booking_number FROM bookings WHERE user_id = :userId OR driver_profile_id IN (:...targetIds)))',
        { targetIds, userId },
      )
      .orderBy('r.createdAt', 'DESC')
      .take(100)
      .getMany();

    if (!reviews || reviews.length === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        recentReviews: [],
      };
    }

    let sum = 0;
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of reviews) {
      sum += r.rating;
      distribution[r.rating] = (distribution[r.rating] || 0) + 1;
    }

    const averageRating = parseFloat((sum / reviews.length).toFixed(1));
    return {
      averageRating,
      totalReviews: reviews.length,
      distribution,
      recentReviews: reviews.slice(0, 10),
    };
  }

  /**
   * Check if a review already exists for a specific booking
   */
  async getBookingReview(bookingId: string, reviewerId?: string) {
    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .where('r.booking_id = :bookingId', { bookingId });

    if (reviewerId) {
      qb.andWhere('r.reviewer_id = :reviewerId', { reviewerId });
    }

    const review = await qb.getOne();
    return {
      hasReviewed: !!review,
      review: review || null,
    };
  }

  /**
   * Query reviews with pagination and filtering
   */
  async findAll(dto: QueryReviewsDto) {
    const {
      page = 1,
      limit = 10,
      targetId,
      targetType,
      serviceType,
      reviewerRole,
      bookingId,
      rating,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = dto;

    const qb = this.reviewRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.reviewer', 'reviewer')
      .leftJoinAndSelect('r.targetUser', 'targetUser');

    if (targetId) {
      qb.andWhere('r.target_id = :targetId', { targetId });
    }
    if (targetType) {
      qb.andWhere('r.target_type = :targetType', { targetType });
    }
    if (serviceType) {
      qb.andWhere('r.service_type = :serviceType', { serviceType });
    }
    if (reviewerRole) {
      qb.andWhere('r.reviewer_role = :reviewerRole', { reviewerRole });
    }
    if (bookingId) {
      qb.andWhere('r.booking_id = :bookingId', { bookingId });
    }
    if (rating) {
      qb.andWhere('r.rating = :rating', { rating });
    }

    const allowedSortColumns: Record<string, string> = {
      createdAt: 'r.createdAt',
      rating: 'r.rating',
    };
    const orderCol = allowedSortColumns[sortBy] || 'r.createdAt';
    qb.orderBy(orderCol, sortOrder === 'ASC' ? 'ASC' : 'DESC');

    qb.skip((page - 1) * limit).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
