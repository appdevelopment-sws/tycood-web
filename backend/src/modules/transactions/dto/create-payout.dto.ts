import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { BusinessRole } from '../../../common/enums/business-role.enum';

export class CreatePayoutDto {
  @ApiProperty({ description: 'Withdrawal amount in INR', minimum: 1 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ enum: BusinessRole })
  @IsOptional()
  @IsEnum(BusinessRole)
  role?: BusinessRole;

  @ApiPropertyOptional({ description: 'Payment method or destination (e.g. BANK_TRANSFER, UPI)', default: 'BANK_TRANSFER' })
  @IsOptional()
  @IsString()
  paymentMethod?: string = 'BANK_TRANSFER';

  @ApiPropertyOptional({ description: 'Settlement Account info (Bank Name, Account number, UPI ID)' })
  @IsOptional()
  @IsString()
  accountDetails?: string;

  @ApiPropertyOptional({ description: 'Optional user note' })
  @IsOptional()
  @IsString()
  notes?: string;
}
