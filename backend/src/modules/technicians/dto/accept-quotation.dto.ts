import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class AcceptQuotationDto {
  @ApiProperty({ example: 'RAZORPAY', default: 'UPI' })
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'pay_ABC123456789' })
  @IsString()
  @IsOptional()
  paymentTransactionId?: string;

  @ApiPropertyOptional({ example: 'Approved, please start work quickly' })
  @IsString()
  @IsOptional()
  customerNotes?: string;
}
