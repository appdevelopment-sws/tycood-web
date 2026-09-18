import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Full name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'rahul@example.com', description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 28, description: 'Age' })
  @IsOptional()
  @IsInt()
  @Min(18)
  age?: number;

  @ApiPropertyOptional({ example: 'Bailey Road, Patna', description: 'Address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+919876599999', description: 'Emergency Contact' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'NewSecret123!', description: 'Optional new password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
