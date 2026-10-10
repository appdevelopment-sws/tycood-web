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

export class ApplyParkingDto {
  // Step 1: Business / Owner Info
  @ApiPropertyOptional({ example: 'Commercial Operator' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ example: 'Patna Central Safe Parking' })
  @IsOptional()
  @IsString()
  facilityName?: string;

  @ApiProperty({ example: 'Rajesh Kumar Singh' })
  @IsString()
  @IsNotEmpty()
  ownerName: string;

  @ApiProperty({ example: '+919835077123' })
  @IsString()
  @IsNotEmpty()
  businessPhone: string;

  @ApiPropertyOptional({ example: 'parking.patna@gmail.com' })
  @IsOptional()
  @IsString()
  businessEmail?: string;

  @ApiPropertyOptional({ example: '10AAACR5521L1Z8' })
  @IsOptional()
  @IsString()
  gstin?: string;

  // Step 2: Location
  @ApiProperty({ example: 'Station Road, Near Platform 1 Exit' })
  @IsString()
  @IsNotEmpty()
  address: string;

  @ApiPropertyOptional({ example: 'Opposite Maurya Lok Complex' })
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiPropertyOptional({ example: 25.594095, description: 'GPS Latitude of the facility/landmark' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 85.137566, description: 'GPS Longitude of the facility/landmark' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ example: 25.594095, description: 'GPS Latitude of the prominent landmark' })
  @IsOptional()
  @IsNumber()
  landmarkLatitude?: number;

  @ApiPropertyOptional({ example: 85.137566, description: 'GPS Longitude of the prominent landmark' })
  @IsOptional()
  @IsNumber()
  landmarkLongitude?: number;

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

  // Step 3: Capacity & Amenities
  @ApiPropertyOptional({ example: 45 })
  @IsOptional()
  @IsInt()
  @Min(0)
  carSlotsTotal?: number;

  @ApiPropertyOptional({ example: 35 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bikeSlotsTotal?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(0)
  evChargingPoints?: number;

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

  // Step 4: Operating Hours & Rates
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isOpen24x7?: boolean;

  @ApiPropertyOptional({ example: '24x7 Open (Mon - Sun)' })
  @IsOptional()
  @IsString()
  operatingHours?: string;

  @ApiPropertyOptional({ example: 30.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carHourlyRate?: number;

  @ApiPropertyOptional({ example: 250.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  carDailyRate?: number;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bikeHourlyRate?: number;

  // Step 5: Documents
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  ownershipProofUploaded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  tradeLicenseUploaded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  facilityPhotosUploaded?: boolean;

  // Step 6: Bank
  @ApiPropertyOptional({ example: 'Patna Central Parking Corp' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ example: 'HDFC Bank' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '50200088192341' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'HDFC0001928' })
  @IsOptional()
  @IsString()
  ifscCode?: string;
}
