import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, Max, Min } from 'class-validator';

export class ReverseGeocodeDto {
  @ApiProperty({
    description: 'Latitude of the location (-90 to 90)',
    example: 25.5941,
    type: Number,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(-90, { message: 'lat must be between -90 and 90' })
  @Max(90, { message: 'lat must be between -90 and 90' })
  lat: number;

  @ApiProperty({
    description: 'Longitude of the location (-180 to 180)',
    example: 85.1376,
    type: Number,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  @Min(-180, { message: 'lng must be between -180 and 180' })
  @Max(180, { message: 'lng must be between -180 and 180' })
  lng: number;
}
