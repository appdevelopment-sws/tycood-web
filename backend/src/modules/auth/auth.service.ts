import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyResetOtpDto } from './dto/verify-reset-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { PasswordReset } from './entities/password-reset.entity';
import { BusinessRole } from '../../common/enums/business-role.enum';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    @InjectRepository(PasswordReset)
    private readonly passwordResetRepo: Repository<PasswordReset>,
  ) {}

  async register(dto: RegisterDto) {
    const isProviderRegistration =
      dto.userType &&
      (dto.userType.toUpperCase().trim() === 'PROVIDER' ||
        dto.userType.toUpperCase().trim() === 'PARTNER');

    const defaultRole = isProviderRegistration
      ? BusinessRole.PARTNER
      : BusinessRole.CUSTOMER;

    const user = await this.usersService.create(
      {
        name: dto.name,
        email: dto.email,
        password: dto.password,
        phone: dto.phone,
      },
      defaultRole,
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

    // Enforce role separation between Customer and Service Provider portals
    if (dto.userType) {
      const normalizedUserType = dto.userType.toUpperCase().trim();
      const providerRoles = [
        BusinessRole.PARTNER,
        BusinessRole.DRIVER,
        BusinessRole.TECHNICIAN,
        BusinessRole.PARKING_OPERATOR,
        BusinessRole.BUS_OPERATOR,
      ];
      const isProvider = roles.some((r) => providerRoles.includes(r as BusinessRole));
      const isCustomer = roles.includes(BusinessRole.CUSTOMER);
      const isAdmin =
        roles.includes(BusinessRole.ADMIN) ||
        roles.includes(BusinessRole.SUPER_ADMIN);

      if (normalizedUserType === 'USER' || normalizedUserType === 'CUSTOMER') {
        if (isProvider) {
          throw new UnauthorizedException(
            'Access denied: Service provider accounts cannot log in to the Customer app. Please use the Partner app.',
          );
        }
        if (!isCustomer && !isAdmin) {
          throw new UnauthorizedException(
            'Access denied: Only Customer accounts can log in to this app.',
          );
        }
      } else if (normalizedUserType === 'PROVIDER' || normalizedUserType === 'PARTNER') {
        if (!isProvider && !isAdmin) {
          throw new UnauthorizedException(
            'Access denied: Customer accounts cannot log in to the Partner app. Only registered service providers can log in.',
          );
        }
      } else if (normalizedUserType === 'ADMIN') {
        if (!isAdmin) {
          throw new UnauthorizedException(
            'Access denied: Admin credentials required.',
          );
        }
      }
    }

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

  async deleteAccount(userId: string) {
    return this.usersService.delete(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new NotFoundException(
        'No account found with this email address. Please check and try again.',
      );
    }

    if (!user.isActive) {
      throw new BadRequestException(
        'This account has been deactivated. Please contact support.',
      );
    }

    // Role verification if userType is specified (e.g. PROVIDER vs CUSTOMER)
    if (dto.userType) {
      const normalizedUserType = dto.userType.toUpperCase().trim();
      const roles = await this.usersService.getUserRoleNames(user.id);
      const providerRoles = [
        BusinessRole.PARTNER,
        BusinessRole.DRIVER,
        BusinessRole.TECHNICIAN,
        BusinessRole.PARKING_OPERATOR,
        BusinessRole.BUS_OPERATOR,
      ];
      const isProvider = roles.some((r) => providerRoles.includes(r as BusinessRole));
      const isCustomer = roles.includes(BusinessRole.CUSTOMER);
      const isAdmin =
        roles.includes(BusinessRole.ADMIN) ||
        roles.includes(BusinessRole.SUPER_ADMIN);

      if (normalizedUserType === 'USER' || normalizedUserType === 'CUSTOMER') {
        if (!isCustomer && !isAdmin) {
          throw new BadRequestException(
            'This email is not registered as a customer account. Please use the Partner app if you are a service provider.',
          );
        }
      } else if (normalizedUserType === 'PROVIDER' || normalizedUserType === 'PARTNER') {
        if (!isProvider && !isAdmin) {
          throw new BadRequestException(
            'This email is not registered as a service provider account. Please use the Customer app.',
          );
        }
      }
    }

    // Invalidate any existing unused OTPs for this email
    await this.passwordResetRepo.update(
      { email: normalizedEmail, isUsed: false },
      { isUsed: true },
    );

    // Generate a secure 6-digit OTP and reset token
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    const resetRecord = this.passwordResetRepo.create({
      email: normalizedEmail,
      otp,
      token: resetToken,
      expiresAt,
      isUsed: false,
    });

    await this.passwordResetRepo.save(resetRecord);

    this.logger.log(
      `Password reset requested for ${normalizedEmail}. Generated OTP: ${otp} (expires in 15 mins)`,
    );

    return {
      success: true,
      message: 'Password reset OTP has been sent successfully.',
      email: normalizedEmail,
      otp, // Provided for direct developer testing & simulated delivery
      expiresIn: 900,
    };
  }

  async verifyResetOtp(dto: VerifyResetOtpDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const otp = dto.otp.trim();

    const record = await this.passwordResetRepo.findOne({
      where: {
        email: normalizedEmail,
        otp,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('Invalid verification code. Please check and try again.');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Verification code has expired. Please request a new code.');
    }

    return {
      success: true,
      message: 'Verification code verified successfully.',
      resetToken: record.token,
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const otp = dto.otp.trim();

    const record = await this.passwordResetRepo.findOne({
      where: {
        email: normalizedEmail,
        otp,
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!record) {
      throw new BadRequestException('Invalid or expired password reset request.');
    }

    if (new Date() > record.expiresAt) {
      throw new BadRequestException('Password reset request has expired. Please start over.');
    }

    if (dto.resetToken && record.token && dto.resetToken !== record.token) {
      throw new BadRequestException('Invalid reset token verification.');
    }

    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new NotFoundException('Account not found.');
    }

    // Hash the new password with bcrypt salt rounds = 10
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.usersService.updatePassword(user.id, passwordHash);

    // Invalidate reset record
    record.isUsed = true;
    await this.passwordResetRepo.save(record);

    this.logger.log(`Password reset completed successfully for ${normalizedEmail}`);

    return {
      success: true,
      message: 'Your password has been successfully reset. Please log in with your new password.',
    };
  }
}
