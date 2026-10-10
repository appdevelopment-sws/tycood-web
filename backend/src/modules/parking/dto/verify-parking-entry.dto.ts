import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class VerifyParkingEntryDto {
  @ApiPropertyOptional({ description: '6-digit customer gate PIN OTP' })
  @IsOptional()
  @IsString()
  gatePinOtp?: string;

  @ApiPropertyOptional({ description: 'Digital QR code raw payload string' })
  @IsOptional()
  @IsString()
  qrCodePayload?: string;

  @ApiPropertyOptional({ description: 'Unique booking reference number' })
  @IsOptional()
  @IsString()
  bookingNumber?: string;

  @ApiPropertyOptional({ description: 'Customer vehicle registration plate number' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ description: 'Gate operator assigned parking bay', example: 'Bay B1-14' })
  @IsOptional()
  @IsString()
  allocatedBay?: string;
}
