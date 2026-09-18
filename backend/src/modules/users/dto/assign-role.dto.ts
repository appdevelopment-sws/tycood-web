import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BusinessRole } from '../../../common/enums/business-role.enum';
import { RoleAssignmentStatus } from '../../../common/enums/role-status.enum';

export class AssignRoleDto {
  @ApiProperty({ enum: BusinessRole, example: BusinessRole.DRIVER })
  @IsEnum(BusinessRole)
  @IsNotEmpty()
  roleName: BusinessRole;

  @ApiPropertyOptional({
    enum: RoleAssignmentStatus,
    default: RoleAssignmentStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(RoleAssignmentStatus)
  status?: RoleAssignmentStatus = RoleAssignmentStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'Optional rejection reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}
