import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Hatchback' })
  @IsString()
  @IsNotEmpty()
  vehicleCategory: string;

  @ApiPropertyOptional({ example: 'Hatchback Economy' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Tata Tiago, Maruti WagonR or similar' })
  @IsOptional()
  @IsString()
  similarModels?: string;

  @ApiPropertyOptional({ example: 'Maruti Suzuki' })
  @IsOptional()
  @IsString()
  make?: string;

  @ApiPropertyOptional({ example: 'WagonR ZXI' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({ example: 'BR 01 HB 3319' })
  @IsOptional()
  @IsString()
  registrationNumber?: string;

  @ApiPropertyOptional({ example: 'Silky Silver' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '2023' })
  @IsOptional()
  @IsString()
  manufacturingYear?: string;

  @ApiPropertyOptional({ example: 'CNG + Petrol' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  seatingCapacity?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  luggageCapacity?: number;

  @ApiPropertyOptional({ example: 'RC-BR01-889912' })
  @IsOptional()
  @IsString()
  rcNumber?: string;

  @ApiPropertyOptional({ example: 'POL-ICICI-992144' })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ example: 'All India Commercial Tourist Permit' })
  @IsOptional()
  @IsString()
  permitType?: string;

  // --- Dynamic Pricing Engine ---
  @ApiPropertyOptional({ example: 699.0, description: 'Base trip fare' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseFare?: number;

  @ApiPropertyOptional({ example: 10.0, description: 'Base included km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  baseKm?: number;

  @ApiPropertyOptional({ example: 12.0, description: 'Per km charge' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  perKmCharge?: number;

  @ApiPropertyOptional({ example: 15.0, description: 'Extra km charge beyond package' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  extraKmCharge?: number;

  @ApiPropertyOptional({ example: 11.0, description: 'Roundoff cost per km' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  roundoffCostPerKm?: number;

  @ApiPropertyOptional({ example: 2499.0, description: 'Outstation base package charge' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  outstationBaseCharge?: number;

  @ApiPropertyOptional({ example: 14.0, description: 'Outstation per km charge' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  outstationPerKmCharge?: number;

  @ApiPropertyOptional({ example: 839.0, description: 'Original strike-through fare' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  originalFare?: number;

  // --- App Card Presentation & Badges ---
  @ApiPropertyOptional({ example: 'FASTEST', description: 'Badge tag shown on card' })
  @IsOptional()
  @IsString()
  badgeTag?: string;

  @ApiPropertyOptional({ example: 4.8, description: 'Rating (1 to 5)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rating?: number;

  @ApiPropertyOptional({ example: 412, description: 'Count of customer reviews' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  reviewsCount?: number;

  @ApiPropertyOptional({ example: 6, description: 'Estimated arrival in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  etaMinutes?: number;

  @ApiPropertyOptional({ example: 'assets/car.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    example: ['Compact & Fast', 'AC Included', 'Best City Commute', 'Instant Dispatch'],
    description: 'Feature checkmarks shown on the card',
  })
  @IsOptional()
  @IsArray()
  features?: string[];

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hasAc?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  tollIncluded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  freeCancellation?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isInstant?: boolean;

  @ApiPropertyOptional({ enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus = VehicleStatus.ACTIVE;
}
