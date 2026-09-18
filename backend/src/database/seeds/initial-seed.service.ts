import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/users/entities/role.entity';
import { User } from '../../modules/users/entities/user.entity';
import { UserRole } from '../../modules/users/entities/user-role.entity';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum';

@Injectable()
export class InitialSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialSeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdmin();
  }

  private async seedRoles() {
    const defaultRoles = [
      {
        name: BusinessRole.CUSTOMER,
        displayName: 'Customer',
        description: 'Default passenger and service customer account',
        permissions: ['trips:read', 'bookings:read', 'bookings:create'],
      },
      {
        name: BusinessRole.DRIVER,
        displayName: 'Professional Driver',
        description: 'Approved fleet and cab driver partner',
        permissions: ['trips:read', 'trips:update', 'drivers:read'],
      },
      {
        name: BusinessRole.TECHNICIAN,
        displayName: 'Automotive Technician',
        description: 'Verified roadside mechanic and technician partner',
        permissions: ['services:read', 'services:update'],
      },
      {
        name: BusinessRole.PARKING_OPERATOR,
        displayName: 'Parking Operator',
        description: 'Commercial parking facility operator',
        permissions: ['parking:read', 'parking:manage'],
      },
      {
        name: BusinessRole.ADMIN,
        displayName: 'Platform Administrator',
        description: 'Platform management and moderation access',
        permissions: ['users:read', 'users:manage', 'applications:manage'],
      },
      {
        name: BusinessRole.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full unrestricted system access',
        permissions: ['*'],
      },
      {
        name: BusinessRole.BUS_OPERATOR,
        displayName: 'Bus Operator Admin',
        description: 'Manages bus fleet, schedules, and drivers',
        permissions: ['buses:read', 'buses:create', 'trips:read'],
      },
      {
        name: BusinessRole.DISPATCHER,
        displayName: 'Live Dispatcher',
        description: 'Monitors real-time trips and route dispatches',
        permissions: ['trips:read', 'trips:update', 'routes:read'],
      },
      {
        name: BusinessRole.SUPPORT_AGENT,
        displayName: 'Customer Support Agent',
        description: 'Handles support requests and ticket queries',
        permissions: ['bookings:read', 'users:read'],
      },
    ];

    for (const r of defaultRoles) {
      const existing = await this.roleRepo.findOne({ where: { name: r.name } });
      if (!existing) {
        const role = this.roleRepo.create({
          name: r.name,
          displayName: r.displayName,
          description: r.description,
          permissions: r.permissions,
          isSystemRole: true,
        });
        await this.roleRepo.save(role);
        this.logger.log(`Seeded system role: ${r.name}`);
      }
    }
  }

  private async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cabbooking.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    let admin = await this.userRepo.findOne({
      where: { email: adminEmail },
      relations: {
        userRoles: true,
      },
    });

    if (!admin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      admin = this.userRepo.create({
        name: 'System Super Admin',
        email: adminEmail,
        phone: '+919999999999',
        passwordHash,
        isActive: true,
        status: 'ACTIVE',
        city: 'Patna',
      });
      admin = await this.userRepo.save(admin);
      this.logger.log(`Created default admin account: ${adminEmail}`);

      // Assign SUPER_ADMIN and ADMIN roles
      const superAdminRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.SUPER_ADMIN },
      });
      const adminRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.ADMIN },
      });

      if (superAdminRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: admin.id,
            roleId: superAdminRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }

      if (adminRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: admin.id,
            roleId: adminRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }
    }
  }
}
