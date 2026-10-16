import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ApplyTechnicianDto {
  @ApiPropertyOptional({ example: 'Sharma Auto Care & Diagnostics' })
  @IsOptional()
  @IsString()
  workshopName?: string;

  @ApiProperty({
    example: ['Battery Jumpstart', 'OBD Diagnostic Scan', 'Tyre Puncture Repair'],
    description: 'Selected technician skills',
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  specializations: string[];

  @ApiProperty({ example: '3-5 years' })
  @IsString()
  @IsNotEmpty()
  experienceYears: string;

  @ApiPropertyOptional({ example: 'Automobile ITI / Diploma' })
  @IsOptional()
  @IsString()
  tradeQualification?: string;

  @ApiPropertyOptional({ example: 'Specialized in car electrical and diagnostics' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({
    example: ['12V Heavy Duty Jump Cables', 'OBD2 Diagnostic Scanner'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toolsAvailable?: string[];

  @ApiPropertyOptional({ example: 'Bike with Tool Mounts' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'Patna Central & Bailey Road' })
  @IsOptional()
  @IsString()
  baseArea?: string;

  @ApiPropertyOptional({ example: 15.0 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  serviceRadiusKm?: number;

  @ApiPropertyOptional({ example: '24x7 Emergency & Daytime' })
  @IsOptional()
  @IsString()
  operatingShift?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  idProofUploaded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  certificateUploaded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  policeClearanceAccepted?: boolean;

  @ApiPropertyOptional({ example: 'Vikram Sharma' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ example: 'State Bank of India' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ example: '381902847192' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ example: 'SBIN0001234' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ example: 'vikram@oksbi' })
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional({ example: '/uploads/profile.jpg', description: 'Technician avatar photo' })
  @IsOptional()
  @IsString()
  profileImage?: string;

  @ApiPropertyOptional({
    description: 'Services and custom rates configured by technician',
  })
  @IsOptional()
  @IsArray()
  services?: any[];
}
