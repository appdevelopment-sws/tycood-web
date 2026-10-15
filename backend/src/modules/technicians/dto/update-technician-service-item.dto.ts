import { PartialType } from '@nestjs/swagger';
import { CreateTechnicianServiceItemDto } from './create-technician-service-item.dto.js';

export class UpdateTechnicianServiceItemDto extends PartialType(CreateTechnicianServiceItemDto) {}
