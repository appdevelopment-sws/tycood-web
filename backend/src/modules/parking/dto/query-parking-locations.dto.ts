import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import { ParkingLocationStatus } from '../../../common/enums/parking-status.enum';

export class QueryParkingLocationsDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ enum: ParkingLocationStatus })
  @IsOptional()
  @IsEnum(ParkingLocationStatus)
  status?: ParkingLocationStatus;
}
