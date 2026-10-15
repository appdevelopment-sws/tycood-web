import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { BusinessRole } from '../../../common/enums/business-role.enum';
import {
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from '../../../common/enums/transaction.enums';

export class CreateTransactionDto {
  @ApiProperty({ description: 'User UUID' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ enum: BusinessRole })
  @IsOptional()
  @IsEnum(BusinessRole)
  role?: BusinessRole;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({ enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @ApiProperty({ description: 'Amount in INR' })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ default: 'INR' })
  @IsOptional()
  @IsString()
  currency?: string = 'INR';

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus = TransactionStatus.COMPLETED;

  @ApiPropertyOptional({ description: 'Reference ID (e.g. Booking ID, Parking Booking ID)' })
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ description: 'Reference Type' })
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiProperty({ description: 'Transaction Title' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Description or notes' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 'CASH' })
  @IsOptional()
  @IsString()
  paymentMethod?: string = 'CASH';

  @ApiPropertyOptional({ description: 'JSON metadata' })
  @IsOptional()
  metadata?: Record<string, any>;
}
