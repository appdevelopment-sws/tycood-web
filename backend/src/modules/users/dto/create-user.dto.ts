import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsInt,
  Min,
  IsBoolean,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'john@example.com', description: 'Unique email address' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+919876543210', description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'Password123!', description: 'Account password' })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: 28, description: 'User age' })
  @IsOptional()
  @IsInt()
  @Min(18)
  age?: number;

  @ApiPropertyOptional({ example: 'Boring Road, Patna', description: 'Residential address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: '+919876500000', description: 'Emergency contact phone' })
  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @ApiPropertyOptional({ example: 'Patna', description: 'City name' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: true, description: 'Active status' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'CUSTOMER', description: 'Assigned role name' })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiPropertyOptional({ example: 'ACTIVE', description: 'Account status (ACTIVE / INACTIVE)' })
  @IsOptional()
  @IsString()
  status?: string;
}
