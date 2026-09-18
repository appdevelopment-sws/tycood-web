import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class QueryUsersDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by role name (e.g. CUSTOMER, DRIVER)' })
  @IsOptional()
  @IsString()
  role?: string;

  @ApiPropertyOptional({ description: 'Filter by active status (true/false)' })
  @IsOptional()
  @IsString()
  status?: string;
}
