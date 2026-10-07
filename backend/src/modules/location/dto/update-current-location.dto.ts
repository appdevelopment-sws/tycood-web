import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateCurrentLocationDto {
  @ApiProperty({ example: 25.612676, description: 'Current latitude' })
  @IsNumber()
  @IsNotEmpty()
  lat: number;

  @ApiProperty({ example: 85.158875, description: 'Current longitude' })
  @IsNumber()
  @IsNotEmpty()
  lng: number;

  @ApiPropertyOptional({
    example: 'Bailey Road, Patna, Bihar',
    description: 'Current formatted address or locality name',
  })
  @IsOptional()
  @IsString()
  address?: string;
}
