import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsArray,
} from 'class-validator';
import { TechnicianBookingType } from '../../../common/enums/technician-status.enum.js';

export class CreateTechnicianBookingDto {
  @ApiProperty({
    enum: TechnicianBookingType,
    example: TechnicianBookingType.KNOWN_SERVICE,
    description: 'KNOWN_SERVICE for fixed issues or CUSTOM_INSPECTION for unknown/other issue',
  })
  @IsEnum(TechnicianBookingType)
  bookingType: TechnicianBookingType;

  @ApiPropertyOptional({ description: 'Category UUID (optional if CUSTOM_INSPECTION)' })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Catalog Service Item UUID (required for KNOWN_SERVICE)' })
  @IsUUID()
  @IsOptional()
  serviceCatalogItemId?: string;

  @ApiPropertyOptional({ description: 'Provider Service UUID if specific mechanic was selected' })
  @IsUUID()
  @IsOptional()
  providerServiceId?: string;

  @ApiPropertyOptional({ description: 'Specific technician profile UUID if directly dispatched' })
  @IsUUID()
  @IsOptional()
  technicianProfileId?: string;

  @ApiProperty({ example: 'NH 30 Bypass near Zero Mile, Patna' })
  @IsString()
  @IsNotEmpty()
  breakdownLocation: string;

  @ApiProperty({ example: 25.5941 })
  @IsNumber()
  breakdownLat: number;

  @ApiProperty({ example: 85.1376 })
  @IsNumber()
  breakdownLng: number;

  @ApiPropertyOptional({ example: 'Opposite HP Petrol Pump' })
  @IsString()
  @IsOptional()
  landmark?: string;

  @ApiPropertyOptional({ example: 'Hyundai Creta 2022' })
  @IsString()
  @IsOptional()
  vehicleMakeModel?: string;

  @ApiPropertyOptional({ example: 'BR 01 AB 1234' })
  @IsString()
  @IsOptional()
  vehiclePlateNumber?: string;

  @ApiPropertyOptional({ example: 'Car', default: 'Car' })
  @IsString()
  @IsOptional()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'Car engine making loud clanking sound and won\'t turn over' })
  @IsString()
  @IsOptional()
  issueDescription?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['Dead Battery', 'Engine Won\'t Crank'],
    default: [],
  })
  @IsArray()
  @IsOptional()
  symptoms?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['https://storage.example.com/breakdown-1.jpg'],
    default: [],
  })
  @IsArray()
  @IsOptional()
  mediaUrls?: string[];

  @ApiPropertyOptional({ example: 'Please hurry, stranded on highway' })
  @IsString()
  @IsOptional()
  customerNotes?: string;

  @ApiPropertyOptional({ example: 'RAZORPAY', default: 'UPI' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: 'pay_xyz123456' })
  @IsString()
  @IsOptional()
  paymentTransactionId?: string;
}
