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

    // 2. Perform write inside an atomic transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const review = this.reviewRepo.create({
        ...dto,
        reviewerId,
        tags: dto.tags || [],
      });

      const savedReview = await queryRunner.manager.save(Review, review);

      // 3. If target is a USER (e.g. Driver rating Rider, or Rider rating Driver), update User profile rating
      if (dto.targetType === ReviewTargetType.USER) {
        const stats = await queryRunner.manager
          .createQueryBuilder(Review, 'r')
          .select('ROUND(AVG(r.rating)::numeric, 2)', 'avgRating')
          .addSelect('COUNT(r.id)', 'totalCount')
          .where('r.target_id = :targetId', { targetId: dto.targetId })
          .andWhere('r.target_type = :targetType', { targetType: ReviewTargetType.USER })
          .getRawOne();

        const avgRating = stats?.avgRating ? parseFloat(stats.avgRating) : dto.rating;
        const totalCount = stats?.totalCount ? parseInt(stats.totalCount, 10) : 1;

        await queryRunner.manager.update(User, dto.targetId, {
          passengerRating: avgRating,
          passengerReviewsCount: totalCount,
        });
      }

      // 4. If bookingId belongs to a cab booking, update booking snapshot metadata
      if (dto.bookingId) {
        const booking = await queryRunner.manager.findOne(Booking, {
          where: [{ id: dto.bookingId }, { bookingNumber: dto.bookingId }],
        });

        if (booking) {
          booking.metadata = {
            ...(booking.metadata || {}),
            lastReviewedAt: new Date().toISOString(),
            reviewRating: dto.rating,
            reviewTags: dto.tags || [],
          };
          await queryRunner.manager.save(Booking, booking);
        }
      }

      await queryRunner.commitTransaction();

      this.logger.log(
        `Review created: ID=${savedReview.id}, Rating=${dto.rating}, Target=${dto.targetId}`,
      );

      const summary = await this.getTargetSummary(dto.targetId, dto.targetType);
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
