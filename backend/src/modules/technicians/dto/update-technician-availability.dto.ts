import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum';

export class UpdateTechnicianAvailabilityDto {
  @ApiProperty({
    enum: AvailabilityStatus,
    example: AvailabilityStatus.AVAILABLE,
    description: 'Technician operating availability state',
  })
  @IsEnum(AvailabilityStatus)
  @IsNotEmpty()
  availabilityStatus: AvailabilityStatus;
}
