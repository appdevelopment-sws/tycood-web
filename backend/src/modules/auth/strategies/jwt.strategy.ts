import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import { ICurrentUser } from '../../../common/interfaces/current-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKeyForDevelopmentJwt2026',
    });
  }

  async validate(payload: { sub: string; email: string }): Promise<ICurrentUser> {
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User account is inactive or not found');
    }

    const roles = await this.usersService.getUserRoleNames(user.id);
    const permissions = await this.usersService.getUserPermissions(user.id);

    return {
      userId: user.id,
      email: user.email,
      roles,
      permissions,
    };
  }
}
