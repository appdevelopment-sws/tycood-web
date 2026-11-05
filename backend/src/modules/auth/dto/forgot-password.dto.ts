import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered account email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address cannot be empty' })
  email: string;

  @ApiPropertyOptional({
    example: 'PROVIDER',
    description: 'User application role context (CUSTOMER, PROVIDER, ADMIN)',
  })
  @IsOptional()
  @IsString()
  userType?: string;
}
