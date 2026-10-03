import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BookingTripType } from '../../../common/enums/index.js';

export class AvailableCabsQueryDto {
  @ApiPropertyOptional({
    enum: BookingTripType,
    default: BookingTripType.ONE_WAY,
    description: 'Trip type filter',
  })
  @IsOptional()
  @IsEnum(BookingTripType)
  tripType?: BookingTripType = BookingTripType.ONE_WAY;

  @ApiPropertyOptional({
    example: 'Jagdeopath, Patna, Bihar',
    description: 'Pickup location',
  })
  @IsOptional()
  @IsString()
  pickupLocation?: string;

  @ApiPropertyOptional({
    example: 'Danapur, Patna, Bihar',
    description: 'Drop-off location',
  })
  @IsOptional()
  @IsString()
  dropLocation?: string;

  @ApiPropertyOptional({
    example: 'Sedan',
    description: 'Vehicle category (Sedan, SUV / XL, Hatchback, Electric (EV), Luxury)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 45.5,
    description: 'Estimated or calculated trip distance in kilometers',
  })
  @IsOptional()
  distanceKm?: number;

  @ApiPropertyOptional({
    example: 'Varanasi Junction',
    description: 'Intermediate stop if any',
  })
  @IsOptional()
  @IsString()
  intermediateStop?: string;

  @ApiPropertyOptional({ example: 25.5941, description: 'Pickup latitude' })
  @IsOptional()
  pickupLat?: number;

  @ApiPropertyOptional({ example: 85.1376, description: 'Pickup longitude' })
  @IsOptional()
  pickupLng?: number;

  @ApiPropertyOptional({ example: 22.5726, description: 'Drop latitude' })
  @IsOptional()
  dropLat?: number;

  @ApiPropertyOptional({ example: 88.3639, description: 'Drop longitude' })
  @IsOptional()
  dropLng?: number;

  @ApiPropertyOptional({
    example: '2026-10-06',
    description: 'Return date string for round-trip travel',
  })
  @IsOptional()
  @IsString()
  returnDate?: string;
}
