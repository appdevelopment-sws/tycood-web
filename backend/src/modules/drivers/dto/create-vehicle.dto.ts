import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { VehicleStatus } from '../../../common/enums/vehicle-status.enum';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Sedan Prime' })
  @IsString()
  @IsNotEmpty()
  vehicleCategory: string;

  @ApiProperty({ example: 'Maruti Suzuki' })
  @IsString()
  @IsNotEmpty()
  make: string;

  @ApiProperty({ example: 'Dzire VXi' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: 'BR 01 PA 4521' })
  @IsString()
  @IsNotEmpty()
  registrationNumber: string;

  @ApiPropertyOptional({ example: 'White' })
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
  @IsInt()
  @Min(1)
  seatingCapacity?: number;

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

  @ApiPropertyOptional({ enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus = VehicleStatus.ACTIVE;
}
