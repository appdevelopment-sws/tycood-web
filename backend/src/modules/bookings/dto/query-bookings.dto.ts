import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import {
  BookingServiceType,
  BookingStatus,
} from '../../../common/enums/index.js';

export class QueryBookingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: BookingServiceType,
    description: 'Filter bookings by service type (CAB, PARKING, TECHNICIAN)',
  })
  @IsOptional()
  @IsEnum(BookingServiceType)
  serviceType?: BookingServiceType;

  @ApiPropertyOptional({
    enum: BookingStatus,
    description: 'Filter bookings by status (ACTIVE, UPCOMING, COMPLETED, CANCELLED)',
  })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;
}
