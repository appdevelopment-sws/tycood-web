import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ApplicationStatus } from '../../../common/enums/application-status.enum';
import { ProfessionalRole } from '../../../common/enums/business-role.enum';

export class QueryApplicationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: ProfessionalRole, description: 'Filter by requested role' })
  @IsOptional()
  @IsEnum(ProfessionalRole)
  role?: ProfessionalRole;

  @ApiPropertyOptional({ enum: ApplicationStatus, description: 'Filter by application status' })
  @IsOptional()
  @IsEnum(ApplicationStatus)
  status?: ApplicationStatus;
}
