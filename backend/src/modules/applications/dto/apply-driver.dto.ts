import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ApplyDriverDto {
  // Step 2: License
  @ApiProperty({ example: 'BR-0120200049210', description: 'Driving license number' })
  @IsString()
  @IsNotEmpty()
  licenseNumber: string;

  @ApiPropertyOptional({ example: '14/08/2032', description: 'License expiration date' })
  @IsOptional()
  @IsString()
  licenseExpiry?: string;

  @ApiPropertyOptional({
    example: 'Commercial LMV Transport',
    description: 'License type',
  })
  @IsOptional()
  @IsString()
  licenseType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  dlFrontUploaded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  dlBackUploaded?: boolean;

  @ApiPropertyOptional({ example: ['Hindi', 'English'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  // Step 3: Vehicle Information
  @ApiPropertyOptional({ example: 'Sedan Prime' })
  @IsOptional()
  @IsString()
  vehicleCategory?: string;

  @ApiPropertyOptional({ example: 'Maruti Suzuki Dzire' })
  @IsOptional()
  @IsString()
  vehicleMakeModel?: string;

  @ApiPropertyOptional({ example: 'BR 01 PA 4521' })
  @IsOptional()
  @IsString()
  vehiclePlateNumber?: string;

  @ApiPropertyOptional({ example: '2023' })
  @IsOptional()
  @IsString()
  manufacturingYear?: string;

  @ApiPropertyOptional({ example: 'CNG + Petrol' })
  @IsOptional()
  @IsString()
  fuelType?: string;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @IsInt()
  @Min(1)
  seatingCapacity?: number;

  // Step 4: RC / Insurance / Permit
  @ApiPropertyOptional({ example: 'RC-BR01-889912' })
  @IsOptional()
  @IsString()
  rcNumber?: string;

  @ApiPropertyOptional({ example: 'POL-ICICI-992144' })
  @IsOptional()
  @IsString()
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ example: 'All India Commercial Tourist Permit' })
  @IsOptional()
  @IsString()
  permitType?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  rcPhotoUploaded?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  insuranceDocUploaded?: boolean;

  // Step 5: Declarations
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  aadhaarVerified?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  policeDeclarationAccepted?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  codeOfConductAccepted?: boolean;
}
