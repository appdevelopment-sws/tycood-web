import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';

export class QueryVehiclesDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by vehicle category (e.g. Hatchback, Sedan, SUV / XL)' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: VehicleStatus, description: 'Filter by vehicle status' })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ description: 'Filter by fuel type' })
  @IsOptional()
  @IsString()
  fuelType?: string;
}
