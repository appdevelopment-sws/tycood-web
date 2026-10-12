import {
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ReviewServiceType,
  ReviewRole,
  ReviewTargetType,
} from '../../../common/enums/index.js';

export class CreateReviewDto {
  @ApiProperty({
    enum: ReviewServiceType,
    example: ReviewServiceType.CAB,
    description: 'Type of service (CAB, PARKING, TECHNICIAN, etc.)',
  })
  @IsEnum(ReviewServiceType)
  serviceType: ReviewServiceType;

  @ApiProperty({
    enum: ReviewRole,
    example: ReviewRole.DRIVER,
    description: 'Role of the person writing the review (DRIVER, RIDER, OPERATOR, etc.)',
  })
  @IsEnum(ReviewRole)
  reviewerRole: ReviewRole;

  @ApiProperty({
    enum: ReviewTargetType,
    example: ReviewTargetType.USER,
    description: 'Type of target being reviewed (USER, VEHICLE, PARKING_LOCATION, etc.)',
  })
  @IsEnum(ReviewTargetType)
  targetType: ReviewTargetType;

  @ApiProperty({
    example: 'd8b48869-2f5f-4a0b-8d7b-9442fa605417',
    description: 'UUID of target entity or user being rated (e.g. rider user ID)',
  })
  @IsUUID()
  targetId: string;

  @ApiPropertyOptional({
    example: 'TRP-12345678',
    description: 'Associated Booking UUID or reference number',
  })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({
    example: 5,
    minimum: 1,
    maximum: 5,
    description: 'Star rating from 1 to 5',
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    example: ['Polite & Respectful', 'On Time at Pickup'],
    description: 'Pre-selected compliment/issue tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    example: 'Pleasant ride, passenger was punctual and courteous!',
    description: 'Detailed review comment / extra feedback',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Optional metadata for service-specific extensions',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
