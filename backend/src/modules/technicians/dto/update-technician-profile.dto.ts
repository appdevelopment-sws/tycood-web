import { PartialType } from '@nestjs/swagger';
import { ApplyTechnicianDto } from '../../applications/dto/apply-technician.dto';

export class UpdateTechnicianProfileDto extends PartialType(ApplyTechnicianDto) {}
