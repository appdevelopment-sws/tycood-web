import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

export class ConfirmParkingPaymentDto {
  @ApiProperty({ description: 'Payment method used', example: 'UPI' })
  @IsString()
  @Length(2, 50)
  paymentMethod: string;

  @ApiPropertyOptional({ description: 'Gateway transaction reference or authorization ID' })
  @IsOptional()
  @IsString()
  transactionId?: string;

  @ApiPropertyOptional({ description: 'Payment gateway provider name', example: 'Razorpay / Cashfree / GPay' })
  @IsOptional()
  @IsString()
  gatewayName?: string;
}
