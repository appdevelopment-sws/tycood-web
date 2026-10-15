import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto.js';
import {
  TechnicianBookingStatus,
  TechnicianBookingType,
  QuotationStatus,
} from '../../../common/enums/technician-status.enum.js';

export class QueryTechnicianBookingsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: TechnicianBookingStatus })
  @IsEnum(TechnicianBookingStatus)
  @IsOptional()
  status?: TechnicianBookingStatus;

  @ApiPropertyOptional({ enum: TechnicianBookingType })
  @IsEnum(TechnicianBookingType)
  @IsOptional()
  bookingType?: TechnicianBookingType;

  @ApiPropertyOptional({ enum: QuotationStatus })
  @IsEnum(QuotationStatus)
  @IsOptional()
  quotationStatus?: QuotationStatus;

  @ApiPropertyOptional({ description: 'Filter by technician profile ID' })
  @IsUUID()
  @IsOptional()
  technicianProfileId?: string;

  @ApiPropertyOptional({ description: 'Filter by customer user ID' })
  @IsUUID()
  @IsOptional()
  userId?: string;
}
