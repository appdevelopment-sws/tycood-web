import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
} from 'class-validator';
import { LoadStatus, PaymentTerms } from '../enums/logistics.enums';

export class CreateLoadDto {
  @ApiPropertyOptional({ example: 'LD-8821' })
  @IsOptional()
  @IsString()
  loadNumber?: string;

  @ApiProperty({ example: 'Durgawati', description: 'Origin pickup city' })
  @IsString()
  @IsNotEmpty()
  pickupCity: string;

  @ApiPropertyOptional({ example: 'Bihar', default: 'Bihar' })
  @IsOptional()
  @IsString()
  pickupState?: string;

  @ApiPropertyOptional({ example: 'Industrial Area Bypass, Durgawati' })
  @IsOptional()
  @IsString()
  pickupAddress?: string;

  @ApiProperty({ example: 'Bihta', description: 'Destination unloading city' })
  @IsString()
  @IsNotEmpty()
  unloadingCity: string;

  @ApiPropertyOptional({ example: 'Bihar', default: 'Bihar' })
  @IsOptional()
  @IsString()
  unloadingState?: string;

  @ApiPropertyOptional({ example: 'Bihta Logistics Park, Near Ring Road' })
  @IsOptional()
  @IsString()
  unloadingAddress?: string;

  @ApiPropertyOptional({ example: 'Address will be shared on call' })
  @IsOptional()
  @IsString()
  addressNote?: string;

  @ApiPropertyOptional({ example: 160 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  distanceKm?: number;

  @ApiProperty({ example: 'Ata chokar', description: 'Goods/cargo description' })
  @IsString()
  @IsNotEmpty()
  product: string;

  @ApiPropertyOptional({ example: 'Agro / Grains' })
  @IsOptional()
  @IsString()
  productCategory?: string;

  @ApiPropertyOptional({ example: 40, description: 'Length of product in feet (e.g. 40ft TMT rods)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productLengthFt?: number;

  @ApiPropertyOptional({ example: '29-30 ton' })
  @IsOptional()
  @IsString()
  totalLoadTons?: string;

  @ApiPropertyOptional({ example: 30 })
  @IsOptional()
  @IsNumber()
  totalLoadNumber?: number;

  @ApiPropertyOptional({ description: 'ID of matching truck type' })
  @IsOptional()
  @IsUUID()
  truckTypeId?: string;

  @ApiPropertyOptional({ example: 'Open' })
  @IsOptional()
  @IsString()
  requiredTruckCategory?: string;

  @ApiPropertyOptional({ example: 'Open Half/Full Body' })
  @IsOptional()
  @IsString()
  requiredTruckTypeDesc?: string;

  @ApiPropertyOptional({ example: '14 Wheeler' })
  @IsOptional()
  @IsString()
  requiredWheels?: string;

  @ApiPropertyOptional({ example: 28, description: 'Minimum body length in feet required' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  requiredMinLengthFt?: number;

  @ApiPropertyOptional({ example: PaymentTerms.TO_PAY })
  @IsOptional()
  @IsString()
  paymentTerms?: string;

  @ApiProperty({ example: 19000, description: 'Transporter offering price per truck' })
  @IsNumber()
  @Min(0)
  ratePerTruck: number;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isRateNegotiable?: boolean;

  @ApiPropertyOptional({
    example: 'Full amount will be paid to the driver at the unloading point',
  })
  @IsOptional()
  @IsString()
  pricingNote?: string;

  @ApiPropertyOptional({ example: 'SKAND KUMAR' })
  @IsOptional()
  @IsString()
  transporterName?: string;

  @ApiPropertyOptional({ example: 'RAJASTHAN GUJARAT ROADWAYS' })
  @IsOptional()
  @IsString()
  transporterCompany?: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @IsOptional()
  @IsString()
  transporterPhone?: string;

  @ApiPropertyOptional({ example: 3.0 })
  @IsOptional()
  @IsNumber()
  transporterRating?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isTransporterVerified?: boolean;

  @ApiPropertyOptional({ enum: LoadStatus, default: LoadStatus.OPEN })
  @IsOptional()
  @IsEnum(LoadStatus)
  status?: LoadStatus;

  @ApiPropertyOptional({ example: 'Handle with care; tarp cover required.' })
  @IsOptional()
  @IsString()
  instructions?: string;
}

export class UpdateLoadDto extends CreateLoadDto {}

export class CreateLoadBidDto {
  @ApiProperty({ example: 'Ramesh Singh' })
  @IsString()
  @IsNotEmpty()
  driverName: string;

  @ApiProperty({ example: '+91 91234 56789' })
  @IsString()
  @IsNotEmpty()
  driverPhone: string;

  @ApiProperty({ example: 19500, description: 'Counter-offer rate proposed by driver' })
  @IsNumber()
  @Min(100)
  proposedRate: number;

  @ApiPropertyOptional({ example: 'BR 01 GB 9922' })
  @IsOptional()
  @IsString()
  vehicleNumber?: string;

  @ApiPropertyOptional({ example: '14 Wheeler Open Body 28ft' })
  @IsOptional()
  @IsString()
  vehicleType?: string;

  @ApiPropertyOptional({ example: 'Ready to load today evening at Durgawati.' })
  @IsOptional()
  @IsString()
  notes?: string;
}
