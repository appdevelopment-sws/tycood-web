import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

export class AssignVehicleDto {
  @ApiProperty({ description: 'Vehicle UUID' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiPropertyOptional({ default: true, description: 'Is primary vehicle for driver' })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean = true;
}
