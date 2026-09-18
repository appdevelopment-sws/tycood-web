import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BookingStatus } from '../../../common/enums/index.js';

export class UpdateBookingStatusDto {
  @ApiProperty({
    enum: BookingStatus,
    description: 'Target booking status',
  })
  @IsEnum(BookingStatus)
  @IsNotEmpty()
  status: BookingStatus;

  @ApiPropertyOptional({
    example: '4829',
    description: 'Security OTP verification to start or complete ride',
  })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiPropertyOptional({
    example: 'Trip concluded smoothly',
    description: 'Status update note or reason',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
