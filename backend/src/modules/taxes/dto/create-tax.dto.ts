import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { TaxType } from '../enums/tax-type.enum.js';
import { TaxScope } from '../enums/tax-scope.enum.js';

export class CreateTaxDto {
  @ApiProperty({
    example: 'Goods and Services Tax (GST 5%)',
    description: 'Display name of the tax or fee',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({
    example: 'GST_5',
    description: 'Unique alphanumeric identifier / tax code',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({
    enum: TaxType,
    default: TaxType.PERCENTAGE,
    description: 'Calculation method: PERCENTAGE or FIXED amount',
  })
  @IsOptional()
  @IsEnum(TaxType)
  taxType?: TaxType = TaxType.PERCENTAGE;

  @ApiProperty({
    example: 5,
    description: 'Tax rate percentage (e.g. 5 for 5%) or fixed fee amount in currency',
  })
  @IsNumber()
  @Min(0)
  rate: number;

  @ApiPropertyOptional({
    example: 'Standard central & state tax applicable on intra-city rides',
    description: 'Explanation or legal reference note',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    enum: TaxScope,
    default: TaxScope.ALL_RIDES,
    description: 'Trip or ride condition under which this tax applies',
  })
  @IsOptional()
  @IsEnum(TaxScope)
  applicableOn?: TaxScope = TaxScope.ALL_RIDES;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether the tax is already included in base fare or added on top at checkout',
  })
  @IsOptional()
  @IsBoolean()
  isIncludedInFare?: boolean = false;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether tax is actively enforced',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;

  @ApiPropertyOptional({
    default: 0,
    description: 'Sort priority / calculation order',
  })
  @IsOptional()
  @IsNumber()
  priority?: number = 0;
}
