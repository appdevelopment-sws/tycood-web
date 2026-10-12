import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { QueryReviewsDto } from './dto/query-reviews.dto.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CurrentUserDto } from '../../common/interfaces/current-user.interface.js';
import { ReviewTargetType } from '../../common/enums/index.js';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Submit a rating & review',
    description:
      'Creates a new review (e.g. Driver rating Rider, Rider rating Driver, or Parking rating). Atomically updates target summary ratings.',
  })
  @ApiResponse({ status: 201, description: 'Review submitted successfully' })
  @ApiResponse({ status: 409, description: 'Review already submitted for this booking' })
  async createReview(
    @CurrentUser() user: CurrentUserDto,
    @Body() dto: CreateReviewDto,
    @Req() req: any,
  ) {
    const reviewerId = user?.userId || req.user?.id || req.user?.userId;
    return this.reviewsService.createReview(dto, reviewerId);
  }

  @Get('target/:targetId/summary')
  @ApiOperation({
    summary: 'Get target rating summary & analytics',
    description:
      'Returns aggregate average rating, total reviews, star distribution, and frequent compliment/issue tags for a user, vehicle, or parking lot.',
  })
  @ApiParam({ name: 'targetId', description: 'UUID of the target being evaluated' })
  @ApiQuery({ name: 'targetType', enum: ReviewTargetType, required: false })
  async getTargetSummary(
    @Param('targetId') targetId: string,
    @Query('targetType') targetType?: ReviewTargetType,
  ) {
    return this.reviewsService.getTargetSummary(targetId, targetType);
  }

  @Get('booking/:bookingId')
  @ApiOperation({
    summary: 'Check if a booking has already been reviewed',
    description:
      'Returns the review status for a given booking to prevent duplicate review dialogs in the UI.',
  })
  @ApiParam({ name: 'bookingId', description: 'Booking UUID or booking number' })
  async getBookingReview(
    @Param('bookingId') bookingId: string,
    @Query('reviewerId') reviewerId?: string,
  ) {
    return this.reviewsService.getBookingReview(bookingId, reviewerId);
  }

  @Get()
  @ApiOperation({
    summary: 'Query reviews list with filters & pagination',
    description:
      'Fetches reviews with pagination, filterable by targetId, targetType, serviceType, rating, etc.',
  })
  async findAll(@Query() dto: QueryReviewsDto) {
    return this.reviewsService.findAll(dto);
  }
}
