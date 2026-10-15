import { PartialType } from '@nestjs/swagger';
import { CreateTechnicianCategoryDto } from './create-technician-category.dto.js';

export class UpdateTechnicianCategoryDto extends PartialType(CreateTechnicianCategoryDto) {}
