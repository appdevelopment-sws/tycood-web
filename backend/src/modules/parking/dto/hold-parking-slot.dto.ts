import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsString,
  Length,
  IsOptional,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParkingVehicleType } from '../../../common/enums/parking-status.enum';

export class HoldParkingSlotDto {
  @ApiProperty({ description: 'Parking facility UUID' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ enum: ParkingVehicleType, description: 'Type of vehicle' })
  @IsEnum(ParkingVehicleType)
  vehicleType: ParkingVehicleType;

  @ApiProperty({ description: 'Vehicle registration plate number', example: 'BR 01 CA 8899' })
  @IsString()
  @Length(3, 50)
  vehicleNumber: string;

  @ApiProperty({ description: 'Scheduled check-in timestamp in ISO 8601' })
  @IsDateString()
  checkInTime: string;

  @ApiPropertyOptional({ default: 2, description: 'Duration in hours (1-720)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(720)
  durationHours?: number = 2;

  @ApiPropertyOptional({ description: 'Allocated parking floor preference' })
  @IsOptional()
  @IsString()
  allocatedFloor?: string;

  @ApiPropertyOptional({ description: 'Allocated parking bay preference' })
  @IsOptional()
  @IsString()
  allocatedBay?: string;

  @ApiPropertyOptional({ type: [String], description: 'Selected addon IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedAddonIds?: string[];

  @ApiPropertyOptional({ description: 'Addons total price' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  addonsPrice?: number;

  @ApiPropertyOptional({ description: 'User driver notes or instructions' })
  @IsOptional()
  @IsString()
  notes?: string;
}
