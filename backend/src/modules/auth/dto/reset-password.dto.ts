import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, Length } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Registered account email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email address cannot be empty' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit verification OTP code',
  })
  @IsString()
  @IsNotEmpty({ message: 'OTP code cannot be empty' })
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp: string;

  @ApiPropertyOptional({
    example: 'reset_token_xyz',
    description: 'Optional reset token received during OTP verification',
  })
  @IsOptional()
  @IsString()
  resetToken?: string;

  @ApiProperty({
    example: 'NewSecurePassword@123',
    description: 'New password (min 6 characters)',
  })
  @IsString()
  @IsNotEmpty({ message: 'New password cannot be empty' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  newPassword: string;
}
