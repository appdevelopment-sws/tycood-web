import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TaxType } from '../enums/tax-type.enum.js';
import { TaxScope } from '../enums/tax-scope.enum.js';

export class QueryTaxesDto {
  @ApiPropertyOptional({ description: 'Search by tax name or code' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: TaxType, description: 'Filter by tax type' })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType;

  @ApiPropertyOptional({ enum: TaxScope, description: 'Filter by applicability scope' })
  @IsOptional()
  @IsEnum(TaxScope)
  applicableOn?: TaxScope;

  @ApiPropertyOptional({ description: 'Filter by active status (true/false/all)' })
  @IsOptional()
  @IsString()
  isActive?: string;

  @ApiPropertyOptional({ default: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
