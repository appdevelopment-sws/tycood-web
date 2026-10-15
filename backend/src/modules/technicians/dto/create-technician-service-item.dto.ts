import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';

export class CreateTechnicianServiceItemDto {
  @ApiProperty({ description: 'Parent category UUID' })
  @IsUUID()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'Jumpstart Dead Battery' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ example: 'Heavy-duty cables + booster pack jumpstart with 15-min alternator test' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 25, default: 30 })
  @IsInt()
  @Min(5)
  @IsOptional()
  estimatedDurationMinutes?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isInspectionRequired?: boolean;

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
