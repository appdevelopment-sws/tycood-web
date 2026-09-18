import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { VerificationStatus } from '../../../common/enums/verification-status.enum';
import { AvailabilityStatus } from '../../../common/enums/availability-status.enum';

export class QueryDriversDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ enum: AvailabilityStatus })
  @IsOptional()
  @IsEnum(AvailabilityStatus)
  availabilityStatus?: AvailabilityStatus;
}
