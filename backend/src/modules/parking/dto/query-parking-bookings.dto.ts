import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID, IsDateString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  ParkingBookingStatus,
  ParkingVehicleType,
} from '../../../common/enums/parking-status.enum';

export class QueryParkingBookingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ParkingBookingStatus })
  @IsOptional()
  @IsEnum(ParkingBookingStatus)
  status?: ParkingBookingStatus;

  @ApiPropertyOptional({ description: 'Filter by parking facility UUID' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ enum: ParkingVehicleType })
  @IsOptional()
  @IsEnum(ParkingVehicleType)
  vehicleType?: ParkingVehicleType;

  @ApiPropertyOptional({ description: 'Filter bookings from date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter bookings to date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
