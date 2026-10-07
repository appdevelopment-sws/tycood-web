import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  BookingServiceType,
  BookingTripType,
} from '../../../common/enums/index.js';

export class CreateBookingDto {
  @ApiPropertyOptional({
    enum: BookingServiceType,
    default: BookingServiceType.CAB,
    description: 'Service type for booking',
  })
  @IsOptional()
  @IsEnum(BookingServiceType)
  serviceType?: BookingServiceType = BookingServiceType.CAB;

  @ApiPropertyOptional({
    enum: BookingTripType,
    default: BookingTripType.ONE_WAY,
    description: 'Trip type (ONE_WAY, ROUND_TRIP, OUTSTATION)',
  })
  @IsOptional()
  @IsEnum(BookingTripType)
  tripType?: BookingTripType = BookingTripType.ONE_WAY;

  @ApiProperty({
    example: 'Jagdeopath, Patna, Bihar',
    description: 'Starting / pickup address',
  })
  @IsString()
  @IsNotEmpty()
  pickupLocation: string;

  @ApiPropertyOptional({
    example: 25.612676,
    description: 'Pickup Latitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  pickupLat?: number;

  @ApiPropertyOptional({
    example: 85.158875,
    description: 'Pickup Longitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  pickupLng?: number;

  @ApiPropertyOptional({
    example: 'Danapur Railway Station, Patna',
    description: 'Destination / drop address',
  })
  @IsOptional()
  @IsString()
  dropLocation?: string;

  @ApiPropertyOptional({
    example: 25.594095,
    description: 'Drop Latitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  dropLat?: number;

  @ApiPropertyOptional({
    example: 85.045055,
    description: 'Drop Longitude coordinate',
  })
  @IsOptional()
  @IsNumber()
  dropLng?: number;

  @ApiPropertyOptional({
    example: 'Bailey Road Crossing',
    description: 'Optional intermediate waypoint stop',
  })
  @IsOptional()
  @IsString()
  intermediateStop?: string;

  @ApiProperty({
    example: '2026-09-19T10:00:00.000Z',
    description: 'Scheduled ride start date and time in ISO format',
  })
  @IsString()
  @IsNotEmpty()
  scheduledDateTime: string;

  @ApiPropertyOptional({
    example: '2026-09-20T18:00:00.000Z',
    description: 'Scheduled return date and time for round trips',
  })
  @IsOptional()
  @IsString()
  returnDateTime?: string;

  @ApiPropertyOptional({
    example: 'cab_1',
    description: 'Identifier of the selected cab or vehicle',
  })
  @IsOptional()
  @IsString()
  cabId?: string;

  @ApiPropertyOptional({
    example: 'Maruti Suzuki Dzire',
    description: 'Name of the selected cab model',
  })
  @IsOptional()
  @IsString()
  cabName?: string;

  @ApiPropertyOptional({
    example: 'Sedan',
    description: 'Category (Sedan, SUV / XL, Hatchback, EV, Luxury)',
  })
  @IsOptional()
  @IsString()
  cabCategory?: string;

  @ApiPropertyOptional({
    example: 'BR 01 EA 4521',
    description: 'Vehicle registration plate number',
  })
  @IsOptional()
  @IsString()
  cabPlateNumber?: string;

  @ApiProperty({
    example: 649,
    description: 'Base journey fare before taxes and discounts',
  })
  @IsNumber()
  @Min(0)
  baseFare: number;

  @ApiPropertyOptional({
    example: 49,
    default: 49,
    description: 'Platform facilitation fee',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  platformFee?: number = 49;

  @ApiPropertyOptional({
    example: 100,
    default: 0,
    description: 'Applied discount amount',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;

  @ApiProperty({
    example: 598,
    description: 'Final calculated payable amount',
  })
  @IsNumber()
  @Min(0)
  totalAmount: number;

  @ApiPropertyOptional({
    example: 120,
    description: 'Prepaid advance booking amount paid upfront by passenger',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  advanceAmount?: number;

  @ApiPropertyOptional({
    example: 478,
    description: 'Remaining fare balance payable after ride completion',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  remainingAmount?: number;

  @ApiPropertyOptional({
    example: 20,
    description: 'Admin commission percentage used for advance calculation',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  adminCommissionRate?: number;

  @ApiPropertyOptional({
    example: 'UPI',
    default: 'UPI',
    description: 'Payment method chosen (UPI, CARD, CASH, WALLET)',
  })
  @IsOptional()
  @IsString()
  paymentMethod?: string = 'UPI';

  @ApiPropertyOptional({
    example: 'Rahul Kumar',
    description: 'Passenger name (defaults to authenticated user name if omitted)',
  })
  @IsOptional()
  @IsString()
  passengerName?: string;

  @ApiPropertyOptional({
    example: '+91 98765 43210',
    description: 'Passenger contact number (defaults to authenticated user phone if omitted)',
  })
  @IsOptional()
  @IsString()
  passengerPhone?: string;

  @ApiPropertyOptional({
    example: 'Please call when arriving at gate 2',
    description: 'Special pickup notes or instructions for driver',
  })
  @IsOptional()
  @IsString()
  pickupNotes?: string;

  @ApiPropertyOptional({
    example: 'CABSAVE100',
    description: 'Applied promo/coupon code',
  })
  @IsOptional()
  @IsString()
  appliedCoupon?: string;

  @ApiPropertyOptional({
    description: 'Additional service-specific metadata payload',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
