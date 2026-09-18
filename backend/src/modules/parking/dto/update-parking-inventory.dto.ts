import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateParkingInventoryDto {
  @ApiPropertyOptional({
    example: 42,
    description: 'Direct count of currently available car slots',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  availableCarSlots?: number;

  @ApiPropertyOptional({
    example: 28,
    description: 'Direct count of currently available bike slots',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  availableBikeSlots?: number;

  @ApiPropertyOptional({
    example: -1,
    description: 'Relative delta for car slots (-1 on entry, +1 on exit)',
  })
  @IsOptional()
  @IsInt()
  carDelta?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Relative delta for bike slots (-1 on entry, +1 on exit)',
  })
  @IsOptional()
  @IsInt()
  bikeDelta?: number;
}
