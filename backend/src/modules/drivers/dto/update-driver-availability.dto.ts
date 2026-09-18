import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum';

export class UpdateDriverAvailabilityDto {
  @ApiProperty({
    enum: AvailabilityStatus,
    example: AvailabilityStatus.AVAILABLE,
    description: 'Driver operating availability state',
  })
  @IsEnum(AvailabilityStatus)
  @IsNotEmpty()
  availabilityStatus: AvailabilityStatus;
}
