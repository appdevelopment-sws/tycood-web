import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { LoadStatus } from '../enums/logistics.enums';

export class QueryTruckTypesDto {
  @ApiPropertyOptional({ description: 'Search term for name or category' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by category (Open, Container, LCV, Trailer, etc.)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter only active types' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 50;
}

export class QueryLoadsDto {
  @ApiPropertyOptional({ description: 'Search term for product, city, or transporter' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by origin pickup city (e.g. Patna, Durgawati)' })
  @IsOptional()
  @IsString()
  pickupCity?: string;

  @ApiPropertyOptional({ description: 'Filter by destination unloading city (e.g. Bihta)' })
  @IsOptional()
  @IsString()
  unloadingCity?: string;

  @ApiPropertyOptional({ description: 'Filter by truck category (Open, Container, Trailer, etc.)' })
  @IsOptional()
  @IsString()
  truckCategory?: string;

  @ApiPropertyOptional({ description: 'Minimum body length in feet (e.g. 28, 40)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minFeet?: number;

  @ApiPropertyOptional({ description: 'Minimum tonnage required' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minTons?: number;

  @ApiPropertyOptional({ enum: LoadStatus })
  @IsOptional()
  @IsEnum(LoadStatus)
  status?: LoadStatus;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 30;
}
