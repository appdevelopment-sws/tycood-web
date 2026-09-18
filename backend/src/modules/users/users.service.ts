import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<User>> {
    const qb = this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('userRole.role', 'role');

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR user.phone LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.status) {
      qb.andWhere('user.status = :status', { status: query.status });
    }

    if (query.role) {
      qb.andWhere('role.name = :roleName', { roleName: query.role });
    }

    const sortField = query.sortBy === 'name' ? 'user.name' : 'user.createdAt';
    qb.orderBy(sortField, query.sortOrder || 'DESC');

    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { email },
      relations: {
        userRoles: {
          role: true,
        },
      },
    });
  }

  async create(dto: CreateUserDto, defaultRole: BusinessRole = BusinessRole.CUSTOMER): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])],
    });
    if (existing) {
      throw new ConflictException('User with given email or phone already exists');
    }

    let passwordHash: string | undefined;
    if (dto.password) {
      passwordHash = await bcrypt.hash(dto.password, 10);
    }

    const user = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      passwordHash,
      age: dto.age,
      address: dto.address,
      emergencyContact: dto.emergencyContact,
      city: dto.city,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      status: 'ACTIVE',
    });

    const savedUser = await this.userRepo.save(user);

    // Assign default role
    const role = await this.roleRepo.findOne({ where: { name: defaultRole } });
    if (role) {
      await this.userRoleRepo.save(
        this.userRoleRepo.create({
          userId: savedUser.id,
          roleId: role.id,
          status: RoleAssignmentStatus.ACTIVE,
          approvedAt: new Date(),
        }),
      );
    }

    return this.findById(savedUser.id);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.userRepo.findOne({ where: { email: dto.email } });
      if (emailExists) {
        throw new ConflictException('Email already in use');
      }
      user.email = dto.email;
    }

    if (dto.phone && dto.phone !== user.phone) {
      const phoneExists = await this.userRepo.findOne({ where: { phone: dto.phone } });
      if (phoneExists) {
        throw new ConflictException('Phone already in use');
      }
      user.phone = dto.phone;
    }

    if (dto.password) {
      user.passwordHash = await bcrypt.hash(dto.password, 10);
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.age !== undefined) user.age = dto.age;
    if (dto.address !== undefined) user.address = dto.address;
    if (dto.emergencyContact !== undefined) user.emergencyContact = dto.emergencyContact;
    if (dto.city !== undefined) user.city = dto.city;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    await this.userRepo.save(user);
    return this.findById(id);
  }

  async assignRole(
    userId: string,
    roleName: BusinessRole,
    status: RoleAssignmentStatus = RoleAssignmentStatus.ACTIVE,
    approvedBy?: string,
  ): Promise<UserRole> {
    const user = await this.findById(userId);
    const role = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!role) {
      throw new NotFoundException(`Role ${roleName} not found`);
    }

    let userRole = await this.userRoleRepo.findOne({
      where: { userId: user.id, roleId: role.id },
    });

    if (userRole) {
      userRole.status = status;
      if (status === RoleAssignmentStatus.APPROVED || status === RoleAssignmentStatus.ACTIVE) {
        userRole.approvedAt = new Date();
        userRole.approvedBy = approvedBy || null;
      }
      return this.userRoleRepo.save(userRole);
    }

    userRole = this.userRoleRepo.create({
      userId: user.id,
      roleId: role.id,
      status,
      approvedAt:
        status === RoleAssignmentStatus.APPROVED || status === RoleAssignmentStatus.ACTIVE
          ? new Date()
          : null,
      approvedBy: approvedBy || null,
    });

    return this.userRoleRepo.save(userRole);
  }

  async removeRole(userId: string, roleId: string): Promise<void> {
    const userRole = await this.userRoleRepo.findOne({
      where: { userId, roleId },
    });
    if (!userRole) {
      throw new NotFoundException('Assigned role not found for user');
    }
    await this.userRoleRepo.remove(userRole);
  }

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepo.find({ order: { name: 'ASC' } });
  }

  async getUserRoleNames(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: {
        role: true,
      },
    });

    return userRoles
      .filter(
        (ur) =>
          ur.status === RoleAssignmentStatus.ACTIVE ||
          ur.status === RoleAssignmentStatus.APPROVED,
      )
      .map((ur) => ur.role.name);
  }

  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepo.find({
      where: { userId },
      relations: {
        role: true,
      },
    });

    const permissions = new Set<string>();
    for (const ur of userRoles) {
      if (
        ur.status === RoleAssignmentStatus.ACTIVE ||
        ur.status === RoleAssignmentStatus.APPROVED
      ) {
        (ur.role.permissions || []).forEach((p) => permissions.add(p));
      }
    }
    return Array.from(permissions);
  }
}
