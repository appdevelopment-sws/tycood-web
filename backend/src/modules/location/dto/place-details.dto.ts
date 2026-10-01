import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PlaceDetailsDto {
  @ApiProperty({
    description: 'Google Place ID obtained from place autocomplete suggestion',
    example: 'ChIJdeq3yKq48zkR4fIe4Q6u5s8',
  })
  @IsNotEmpty()
  @IsString()
  placeId: string;

  @ApiPropertyOptional({
    description: 'Optional session token matching the autocomplete session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsString()
  sessionToken?: string;
}
