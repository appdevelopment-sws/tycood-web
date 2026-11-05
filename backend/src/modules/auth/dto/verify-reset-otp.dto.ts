import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetOtpDto {
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
}
