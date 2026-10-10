import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum CommissionCalculationType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export enum AdvancePaymentType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
}

export class UpdateParkingSettingsDto {
  @ApiPropertyOptional({ description: 'Enable or disable digital parking bookings across platform' })
  @IsOptional()
  @IsBoolean()
  parkingBookingEnabled?: boolean;

  @ApiPropertyOptional({ enum: CommissionCalculationType, default: CommissionCalculationType.PERCENTAGE })
  @IsOptional()
  @IsEnum(CommissionCalculationType)
  commissionType?: CommissionCalculationType;

  @ApiPropertyOptional({ description: 'Commission rate value (e.g. 15 for 15% or fixed amount in INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  commissionRate?: number;

  @ApiPropertyOptional({ enum: AdvancePaymentType, default: AdvancePaymentType.PERCENTAGE })
  @IsOptional()
  @IsEnum(AdvancePaymentType)
  advanceType?: AdvancePaymentType;

  @ApiPropertyOptional({ description: 'Advance payment value (e.g. 25 for 25% or fixed amount in INR)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  advanceValue?: number;

  @ApiPropertyOptional({ description: 'Minimum advance amount cap in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAdvanceAmount?: number;

  @ApiPropertyOptional({ description: 'Maximum advance amount cap in INR' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAdvanceAmount?: number;

  @ApiPropertyOptional({ description: 'Late check-in grace period in minutes' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  gracePeriodMins?: number;

  @ApiPropertyOptional({ description: 'Cancellation & refund policy disclosure text' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;
}
