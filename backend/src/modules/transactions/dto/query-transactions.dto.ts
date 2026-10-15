import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString, IsUUID } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { BusinessRole } from '../../../common/enums/business-role.enum';
import {
  TransactionType,
  TransactionCategory,
  TransactionStatus,
} from '../../../common/enums/transaction.enums';

export class QueryTransactionsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: BusinessRole })
  @IsOptional()
  @IsEnum(BusinessRole)
  role?: BusinessRole;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionCategory })
  @IsOptional()
  @IsEnum(TransactionCategory)
  category?: TransactionCategory;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ description: 'Filter by Location UUID (for parking facilities)' })
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ description: 'Start Date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End Date (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
