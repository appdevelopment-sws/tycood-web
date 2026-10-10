import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateParkingLocationDto {
  @ApiProperty({ example: 'Station Road Central Facility' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Platform 1 Exit, Station Road, Patna' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Opposite Maurya Lok Complex' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: 'Patna' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: '800001' })
  @IsOptional()
  @IsString()
  pincode?: string;

  @ApiPropertyOptional({ example: 'Covered Basement & Ground' })
  @IsOptional()
  @IsString()
  facilityStructure?: string;

  @ApiPropertyOptional({ example: 25.6025 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 85.1376 })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({ example: 50, description: 'Total car parking slots' })
  @IsInt()
  @Min(0)
  carSlotsTotal: number;

  @ApiProperty({ example: 40, description: 'Total bike parking slots' })
  @IsInt()
  @Min(0)
  bikeSlotsTotal: number;

  @ApiPropertyOptional({ example: 4, description: 'EV charging points available' })
  @IsOptional()
  @IsInt()
  @Min(0)
  evChargingPoints?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOpen24x7?: boolean = true;

  @ApiPropertyOptional({ example: '24x7 Open (Mon - Sun)' })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiPropertyOptional({
    example: {
      monday: {
        isOpen: true,
        is24Hours: false,
        slots: [{ openTime: '15:00', closeTime: '18:00' }],
      },
    },
    description: 'Detailed weekly schedule by day with multiple shifts/slots',
  })
  @IsOptional()
  operatingSchedule?: Record<string, any>;

  @ApiPropertyOptional({ example: '06:00' })
  @IsOptional()
  @IsString()
  openingTime?: string;

  @ApiPropertyOptional({ example: '23:00' })
  @IsOptional()
  @IsString()
  closingTime?: string;

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carHourlyRate?: number = 30.0;

  @ApiPropertyOptional({ example: 250.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carDailyRate?: number = 250.0;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bikeHourlyRate?: number = 15.0;

  @ApiPropertyOptional({
    example: [
      '24/7 Security Guard',
      'CCTV Surveillance',
      'Covered Shade',
      'Automated Barrier Gate',
    ],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];
}
