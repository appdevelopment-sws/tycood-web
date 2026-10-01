import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { TravelMode } from '../interfaces/location.interface.js';

export class GetDirectionsDto {
  @ApiPropertyOptional({
    description: 'Origin latitude (Point A, -90 to 90)',
    example: 25.5941,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  originLat?: number;

  @ApiPropertyOptional({
    description: 'Origin longitude (Point A, -180 to 180)',
    example: 85.1376,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  originLng?: number;

  @ApiPropertyOptional({
    description: 'Destination latitude (Point B, -90 to 90)',
    example: 25.6192,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  destLat?: number;

  @ApiPropertyOptional({
    description: 'Destination longitude (Point B, -180 to 180)',
    example: 85.0886,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  destLng?: number;

  @ApiPropertyOptional({
    description: 'Origin address or Place ID (Point A alternative string)',
    example: 'Patna Junction, Station Road, Patna, Bihar',
  })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({
    description: 'Destination address or Place ID (Point B alternative string)',
    example: 'Jay Prakash Narayan Airport, Patna, Bihar',
  })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional({
    description: 'Travel mode for directions route',
    enum: TravelMode,
    default: TravelMode.DRIVING,
  })
  @IsOptional()
  @IsEnum(TravelMode)
  mode?: TravelMode = TravelMode.DRIVING;
}
