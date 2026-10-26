import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { TruckBodyType } from '../enums/logistics.enums';

export class CreateTruckTypeDto {
  @ApiProperty({ example: 'Open Half/Full Body', description: 'Truck type display name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Open', description: 'Broad category (Open, Container, LCV, etc.)' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({ enum: TruckBodyType, default: TruckBodyType.OPEN_HALF_BODY })
  @IsOptional()
  @IsEnum(TruckBodyType)
  bodyType?: TruckBodyType;

  @ApiPropertyOptional({ example: 28, description: 'Length in feet (critical for long rods/pipes)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lengthFt?: number;

  @ApiPropertyOptional({ example: 8, description: 'Width in feet' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  widthFt?: number;

  @ApiPropertyOptional({ example: 7.5, description: 'Height in feet' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  heightFt?: number;

  @ApiPropertyOptional({ example: '28ft x 8ft x 7.5ft Open High Bed' })
  @IsOptional()
  @IsString()
  dimensionLabel?: string;

  @ApiPropertyOptional({ example: 7.5, description: 'Minimum tonnage capacity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  minTons?: number;

  @ApiPropertyOptional({ example: 43.0, description: 'Maximum tonnage capacity' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxTons?: number;

  @ApiProperty({ example: '7.5 - 43 Ton', description: 'Display capacity range label' })
  @IsString()
  @IsNotEmpty()
  capacityRange: string;

  @ApiPropertyOptional({ example: 14, description: 'Number of wheels/tyres' })
  @IsOptional()
  @IsNumber()
  wheelsNumber?: number;

  @ApiPropertyOptional({ example: '14 Wheeler', description: 'Wheel count label' })
  @IsOptional()
  @IsString()
  wheelCount?: string;

  @ApiPropertyOptional({
    example: ['Iron Rods & Long Steel', 'Pipes', 'Agricultural Produce / Grains', 'Cement'],
    description: 'Types of materials and cargo suitable for this vehicle',
  })
  @IsOptional()
  @IsArray()
  suitableMaterials?: string[];

  @ApiPropertyOptional({ example: 'assets/truck-open.png' })
  @IsOptional()
  @IsString()
  iconUrl?: string;

  @ApiPropertyOptional({ example: 'Ideal for oversized steel, cement, and open freight transport' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateTruckTypeDto extends CreateTruckTypeDto {}
