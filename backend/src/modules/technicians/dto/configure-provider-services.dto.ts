import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  ValidateNested,
  IsUUID,
  IsNumber,
  Min,
  IsBoolean,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProviderServiceItemInputDto {
  @ApiProperty({ description: 'Catalog service item UUID' })
  @IsUUID()
  serviceCatalogItemId: string;

  @ApiProperty({ example: 450.0, description: 'Technician custom service price in INR' })
  @IsNumber()
  @Min(0)
  customPrice: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({ example: 'Includes 30-day labor warranty' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConfigureProviderServicesDto {
  @ApiProperty({
    type: [ProviderServiceItemInputDto],
    description: 'Array of services offered by provider with custom pricing',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProviderServiceItemInputDto)
  services: ProviderServiceItemInputDto[];
}
