import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';

export class ReviewApplicationDto {
  @ApiProperty({
    enum: [ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED],
    example: ApplicationStatus.APPROVED,
    description: 'Updated application review status',
  })
  @IsEnum([ApplicationStatus.UNDER_REVIEW, ApplicationStatus.APPROVED, ApplicationStatus.REJECTED])
  @IsNotEmpty()
  status: ApplicationStatus;

  @ApiPropertyOptional({
    example: 'Documents could not be verified with regional transport office',
    description: 'Mandatory if status is REJECTED',
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({
    example: 'Aadhaar and Driving License confirmed via Digilocker check',
    description: 'Internal reviewer notes',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
