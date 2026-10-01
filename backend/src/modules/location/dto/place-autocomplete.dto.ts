import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

export class PlaceAutocompleteDto {
  @ApiProperty({
    description: 'Text query or search prefix (e.g., street, city, airport, landmark)',
    example: 'Patna Airport',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(2, { message: 'input search term must be at least 2 characters long' })
  input: string;

  @ApiPropertyOptional({
    description:
      'Location type filter. Examples: address, establishment, geocode, (cities), (regions), etc.',
    example: 'establishment',
    default: 'all',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Latitude for location bias / proximity search (-90 to 90)',
    example: 25.5941,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude for location bias / proximity search (-180 to 180)',
    example: 85.1376,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  lng?: number;

  @ApiPropertyOptional({
    description: 'Search radius in meters for proximity bias (e.g., 50000 = 50 km)',
    example: 50000,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  radius?: number;

  @ApiPropertyOptional({
    description: 'Two-letter ISO 3166-1 country code restriction (e.g., "in" for India)',
    example: 'in',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({
    description: 'Session token for Google Places billing grouping (UUID string)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  sessionToken?: string;
}
