import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @ApiProperty({
    example: {
      GOOGLE_MAPS_API_KEY: 'AIzaSy...',
      STRIPE_PUBLISHABLE_KEY: 'pk_test_...',
      CURRENCY_CODE: 'INR',
    },
    description: 'Key-value map of setting identifiers and their values',
  })
  @IsObject()
  @IsNotEmpty()
  settings: Record<string, string>;
}
