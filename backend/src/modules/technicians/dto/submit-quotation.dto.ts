import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, Min, IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SubmitQuotationDto {
  @ApiProperty({ example: 4000.0, description: 'Total quotation amount in INR for the repair' })
  @IsNumber()
  @Min(50)
  quotedAmount: number;

  @ApiProperty({
    example: 'Diagnostic scan revealed alternator rectifier failure. Quotation includes new alternator assembly + on-site labor.',
    description: 'Detailed explanation of work and parts included in quotation',
  })
  @IsString()
  @IsNotEmpty()
  quotationNotes: string;

  @ApiPropertyOptional({ example: 'Estimated repair time: 45 minutes' })
  @IsString()
  @IsOptional()
  technicianNotes?: string;
}
