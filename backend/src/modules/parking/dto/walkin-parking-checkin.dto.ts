import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsString,
  Length,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParkingVehicleType } from '../../../common/enums/parking-status.enum';

export class WalkinParkingCheckinDto {
  @ApiProperty({ description: 'Vehicle registration plate number', example: 'BR 01 CA 9988' })
  @IsString()
  @Length(3, 50)
  vehicleNumber: string;

  @ApiProperty({ enum: ParkingVehicleType, default: ParkingVehicleType.CAR })
  @IsEnum(ParkingVehicleType)
  vehicleType: ParkingVehicleType;

  @ApiPropertyOptional({ description: 'Assigned parking bay', example: 'Bay G-08' })
  @IsOptional()
  @IsString()
  allocatedBay?: string;

  @ApiPropertyOptional({ default: 2, description: 'Expected duration in hours' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  expectedDurationHours?: number = 2;
}
