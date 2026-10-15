import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateTechnicianCategoryDto {
  @ApiProperty({ example: 'Battery & Electrical' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Jumpstart, battery check, alternator service' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'BatteryCharging', default: 'Wrench' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: 'https://example.com/icons/battery.png' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({
    description: 'Flag if this is the "Other / Unaware of Issue" category',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isOther?: boolean;

  @ApiPropertyOptional({ example: 450.0, default: 0.0 })
  @IsOptional()
  basePrice?: number;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  displayOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
