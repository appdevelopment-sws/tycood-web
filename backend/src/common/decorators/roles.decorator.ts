import { SetMetadata } from '@nestjs/common';
import { BusinessRole } from '../enums/business-role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: (BusinessRole | string)[]) =>
  SetMetadata(ROLES_KEY, roles);
