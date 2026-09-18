import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { BusinessRole } from '../enums/business-role.enum';
import { ICurrentUser } from '../interfaces/current-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<(BusinessRole | string)[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: ICurrentUser = request.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied: User has no assigned roles');
    }

    // Super Admin has unrestricted access
    if (user.roles.includes(BusinessRole.SUPER_ADMIN)) {
      return true;
    }

    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        `Access denied: Required one of roles [${requiredRoles.join(', ')}]`,
      );
    }

    return true;
  }
}
