import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CancelBookingDto {
  @ApiProperty({
    example: 'Change of plans',
    description: 'Reason for booking cancellation',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;
}
