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
}
