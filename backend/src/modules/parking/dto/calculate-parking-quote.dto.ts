import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsArray,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ParkingVehicleType } from '../../../common/enums/parking-status.enum';

export class CalculateParkingQuoteDto {
  @ApiProperty({ description: 'Parking facility UUID' })
  @IsUUID()
  locationId: string;

  @ApiProperty({ enum: ParkingVehicleType, description: 'Type of vehicle' })
  @IsEnum(ParkingVehicleType)
  vehicleType: ParkingVehicleType;

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

  @ApiPropertyOptional({ type: [String], description: 'Optional add-on service IDs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedAddonIds?: string[];
}
