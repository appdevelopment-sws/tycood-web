import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class CreateLoadCallLogDto {
  @ApiPropertyOptional({ description: 'ID of the user making the call' })
  @IsOptional()
  @IsUUID()
  callerUserId?: string;

  @ApiProperty({ example: 'Ramesh Singh', description: 'Name of the caller' })
  @IsString()
  @IsNotEmpty()
  callerName: string;

  @ApiProperty({
    example: '+91 98765 43210',
    description: 'Phone number of the caller',
  })
  @IsString()
  @IsNotEmpty()
  callerPhone: string;

  @ApiPropertyOptional({
    example: 'LOAD_DETAILS_SCREEN',
    description: 'Originating source',
  })
  @IsOptional()
  @IsString()
  source?: string;
}

export class QueryLoadCallLogsDto {
  @ApiPropertyOptional({ description: 'Filter by Load ID' })
  @IsOptional()
  @IsUUID()
  loadId?: string;

  @ApiPropertyOptional({
    description: 'Filter or search by caller phone, name or load number',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  limit?: number;
}
