import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { VerificationStatus } from '../../../common/enums/verification-status.enum';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum';

export class QueryTechniciansDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by skill/specialization keyword' })
  @IsOptional()
  @IsString()
  specialization?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availabilityStatus?: AvailabilityStatus;
}
