import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { BusinessRole } from '../../common/enums/business-role.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const user = await this.usersService.create(
      {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
      },
      BusinessRole.CUSTOMER,
    );

    const roles = await this.usersService.getUserRoleNames(user.id);
    const permissions = await this.usersService.getUserPermissions(user.id);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      age: user.age,
      address: user.address,
      emergencyContact: user.emergencyContact,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      city: user.city,
      walletBalance: user.walletBalance,
      roles,
      permissions,
      token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const roles = await this.usersService.getUserRoleNames(user.id);
    const permissions = await this.usersService.getUserPermissions(user.id);

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      age: user.age,
      address: user.address,
      emergencyContact: user.emergencyContact,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      city: user.city,
      walletBalance: user.walletBalance,
      roles,
      permissions,
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    const roles = await this.usersService.getUserRoleNames(user.id);
    const permissions = await this.usersService.getUserPermissions(user.id);

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      age: user.age,
      address: user.address,
      emergencyContact: user.emergencyContact,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      city: user.city,
      walletBalance: user.walletBalance,
      roles,
      permissions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    await this.usersService.update(userId, dto);
    return this.getProfile(userId);
  }
}
