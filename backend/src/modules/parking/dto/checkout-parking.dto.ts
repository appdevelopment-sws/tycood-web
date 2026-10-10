import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CheckoutParkingDto {
  @ApiPropertyOptional({
    description: 'Payment collection method for remaining balance & extra hours (CASH, UPI, FASTAG, CARD)',
    default: 'CASH',
  })
  @IsOptional()
  @IsString()
  collectedRemainingMethod?: string = 'CASH';

  @ApiPropertyOptional({ description: 'Optional discount applied at exit by operator' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountAmount?: number = 0;

  @ApiPropertyOptional({ description: 'Optional checkout remarks or notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
