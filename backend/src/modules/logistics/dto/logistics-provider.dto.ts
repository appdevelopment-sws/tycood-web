import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VerificationStatus } from '../../../common/enums/verification-status.enum';

export class ApplyLogisticsProviderDto {
  @ApiProperty({ description: 'Business or Transporter Firm Name', example: 'Patna Freight Express' })
  @IsString()
  @IsNotEmpty()
  businessName: string;

  @ApiProperty({ description: 'Primary Contact Person', example: 'Rajesh Sharma' })
  @IsString()
  @IsNotEmpty()
  contactPerson: string;

  @ApiProperty({ description: 'Contact Phone Number', example: '+91 98765 43210' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Contact Email', example: 'freight@patna.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ description: 'Operating City', example: 'Patna' })
  @IsString()
  @IsNotEmpty()
  operatingCity: string;

  @ApiProperty({ description: 'Operating Logistics Hub / Mandi', example: 'Transport Nagar, Kumhrar' })
  @IsString()
  @IsNotEmpty()
  operatingHub: string;

  @ApiPropertyOptional({ description: 'Business Category', example: 'Transporter / Fleet Broker' })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({ description: 'Primary Cargo Types handled', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  primaryCargoTypes?: string[];

  @ApiPropertyOptional({ description: 'Required Vehicle Categories', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredVehicleCategories?: string[];

  @ApiPropertyOptional({ description: 'Optional explicit User UUID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'GSTIN Registration Number', example: '10AAACR4829K1Z5' })
  @IsOptional()
  @IsString()
  gstin?: string;

  @ApiPropertyOptional({ description: 'Alternative field name for GSTIN' })
  @IsOptional()
  @IsString()
  gstinNumber?: string;

  @ApiPropertyOptional({ description: 'Business PAN Number', example: 'AAACR4829K' })
  @IsOptional()
  @IsString()
  pan?: string;

  @ApiPropertyOptional({ description: 'Alternative field name for PAN' })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiPropertyOptional({ description: 'Whether GSTIN has been verified via OTP/portal' })
  @IsOptional()
  @IsBoolean()
  isGstVerified?: boolean;

  @ApiPropertyOptional({ description: 'Whether Aadhaar OTP KYC completed' })
  @IsOptional()
  @IsBoolean()
  isAadhaarVerified?: boolean;

  @ApiPropertyOptional({ description: 'Identity proof uploaded status' })
  @IsOptional()
  @IsBoolean()
  idProofUploaded?: boolean;

  @ApiPropertyOptional({ description: 'Business proof uploaded status' })
  @IsOptional()
  @IsBoolean()
  businessProofUploaded?: boolean;

  @ApiPropertyOptional({ description: 'Commercial Bank Account Holder' })
  @IsOptional()
  @IsString()
  accountHolder?: string;

  @ApiPropertyOptional({ description: 'Bank Name' })
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional({ description: 'Bank Account Number' })
  @IsOptional()
  @IsString()
  accountNumber?: string;

  @ApiPropertyOptional({ description: 'IFSC Code' })
  @IsOptional()
  @IsString()
  ifscCode?: string;

  @ApiPropertyOptional({ description: 'UPI ID for settlements' })
  @IsOptional()
  @IsString()
  upiId?: string;
}

export class ReviewLogisticsProviderDto {
  @ApiProperty({ enum: [VerificationStatus.VERIFIED, VerificationStatus.REJECTED] })
  @IsEnum(VerificationStatus)
  status: VerificationStatus;

  @ApiPropertyOptional({ description: 'Mandatory when rejecting an application' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Internal admin review notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class QueryLogisticsProvidersDto {
  @ApiPropertyOptional({ description: 'Search by business name, contact person, phone, or GSTIN' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 30 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 30;
}
