import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity';
import { TechnicianProviderService } from './entities/technician-provider-service.entity';
import { UpdateTechnicianProfileDto } from './dto/update-technician-profile.dto';
import { QueryTechniciansDto } from './dto/query-technicians.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AvailabilityStatus } from '../../common/enums/availability-status.enum';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../users/entities/role.entity.js';
import { UserRole } from '../users/entities/user-role.entity.js';
import { ProfessionalApplication } from '../applications/entities/professional-application.entity.js';
import { BusinessRole, ProfessionalRole } from '../../common/enums/business-role.enum.js';
import { ApplicationStatus } from '../../common/enums/application-status.enum.js';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum.js';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(TechnicianProfile)
    private readonly techRepo: Repository<TechnicianProfile>,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string): Promise<TechnicianProfile> {
    let profile = await this.techRepo.findOne({
      where: { userId },
      relations: {
        user: true,
      },
    });
    if (!profile) {
      // Auto-provision profile if user exists in the system
      const user = await this.dataSource.getRepository(User).findOne({ where: { id: userId } });
      if (user) {
        profile = this.techRepo.create({
          userId: user.id,
          workshopName: `${user.name}'s Workshop`,
          baseArea: user.city || 'Patna Central',
          serviceRadiusKm: 15.0,
          specializations: ['Emergency Roadside Assistance', 'Towing & Recovery', 'Jump Start & Battery'],
          toolsAvailable: ['Diagnostic Scanner', 'Hydraulic Jack', 'Battery Jump Starter'],
          vehicleType: 'Service Bike / Van',
          verificationStatus: VerificationStatus.VERIFIED,
          availabilityStatus: AvailabilityStatus.AVAILABLE,
        });
        profile = await this.techRepo.save(profile);
        profile.user = user;
      } else {
        throw new NotFoundException('Technician profile not found for user');
      }
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateTechnicianProfileDto,
  ): Promise<TechnicianProfile> {
    const profile = await this.findByUserId(userId);

    Object.assign(profile, dto);
    return this.techRepo.save(profile);
  }

  async updateAvailability(
    userId: string,
    status: AvailabilityStatus,
  ): Promise<TechnicianProfile> {
    const profile = await this.findByUserId(userId);

    if (
      status === AvailabilityStatus.AVAILABLE &&
      profile.verificationStatus !== VerificationStatus.VERIFIED
    ) {
      throw new ForbiddenException(
        'Technician must be VERIFIED by platform administration before accepting jobs or going AVAILABLE',
      );
    }

    profile.availabilityStatus = status;
    return this.techRepo.save(profile);
  }

  async findAll(query: QueryTechniciansDto): Promise<PaginatedResult<TechnicianProfile>> {
    // Auto-provision missing technician profiles for users with TECHNICIAN role
    try {
      const usersWithTechRole = await this.dataSource
        .getRepository(User)
        .createQueryBuilder('user')
        .innerJoin('user.userRoles', 'userRole')
        .innerJoin('userRole.role', 'role')
        .leftJoin('user.technicianProfile', 'tech')
        .where('role.name = :roleName', { roleName: BusinessRole.TECHNICIAN })
        .andWhere('tech.id IS NULL')
        .getMany();

      for (const u of usersWithTechRole) {
        const newProfile = this.techRepo.create({
          userId: u.id,
          workshopName: `${u.name}'s Workshop`,
          baseArea: u.city || 'Patna Central',
          serviceRadiusKm: 15.0,
          specializations: ['Emergency Roadside Assistance', 'Towing & Recovery', 'Jump Start & Battery'],
          toolsAvailable: ['Diagnostic Scanner', 'Hydraulic Jack', 'Battery Jump Starter'],
          vehicleType: 'Service Bike / Van',
          verificationStatus: VerificationStatus.VERIFIED,
          availabilityStatus: AvailabilityStatus.AVAILABLE,
        });
        await this.techRepo.save(newProfile);
      }
    } catch (_) {}

    const qb = this.techRepo
      .createQueryBuilder('tech')
      .leftJoinAndSelect('tech.user', 'user');

    if (query.verificationStatus) {
      qb.andWhere('tech.verificationStatus = :verificationStatus', {
        verificationStatus: query.verificationStatus,
      });
    }

    if (query.availabilityStatus) {
      qb.andWhere('tech.availabilityStatus = :availabilityStatus', {
        availabilityStatus: query.availabilityStatus,
      });
    }

    if (query.specialization) {
      qb.andWhere(':spec = ANY(tech.specializations)', {
        spec: query.specialization,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(tech.workshopName) LIKE LOWER(:search) OR LOWER(user.name) LIKE LOWER(:search) OR LOWER(tech.baseArea) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('tech.createdAt', query.sortOrder || 'DESC');
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

  async verifyTechnician(id: string, adminId: string, notes?: string): Promise<TechnicianProfile> {
    const tech = await this.techRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!tech) {
      throw new NotFoundException(`Technician profile not found with ID ${id}`);
    }

    return this.dataSource.transaction(async (manager) => {
      tech.verificationStatus = VerificationStatus.VERIFIED;
      const savedTech = await manager.save(tech);

      // Assign TECHNICIAN role to user
      const role = await manager.findOne(Role, { where: { name: BusinessRole.TECHNICIAN } });
      if (role) {
        let userRole = await manager.findOne(UserRole, {
          where: { userId: tech.userId, roleId: role.id },
        });
        if (userRole) {
          userRole.status = RoleAssignmentStatus.APPROVED;
          userRole.approvedAt = new Date();
          userRole.approvedBy = adminId;
          await manager.save(userRole);
        } else {
          await manager.save(
            manager.create(UserRole, {
              userId: tech.userId,
              roleId: role.id,
              status: RoleAssignmentStatus.APPROVED,
              approvedAt: new Date(),
              approvedBy: adminId,
            }),
          );
        }
      }

      // Update any pending applications
      await manager.update(
        ProfessionalApplication,
        {
          userId: tech.userId,
          requestedRole: ProfessionalRole.TECHNICIAN,
          status: ApplicationStatus.PENDING,
        },
        {
          status: ApplicationStatus.APPROVED,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          notes: notes || 'Verified by admin',
        },
      );

      return savedTech;
    });
  }

  async rejectTechnician(id: string, adminId: string, rejectionReason?: string): Promise<TechnicianProfile> {
    const tech = await this.techRepo.findOne({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException(`Technician profile not found with ID ${id}`);
    }

    return this.dataSource.transaction(async (manager) => {
      tech.verificationStatus = VerificationStatus.REJECTED;
      const savedTech = await manager.save(tech);

      await manager.update(
        ProfessionalApplication,
        {
          userId: tech.userId,
          requestedRole: ProfessionalRole.TECHNICIAN,
          status: ApplicationStatus.PENDING,
        },
        {
          status: ApplicationStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedBy: adminId,
          rejectionReason: rejectionReason || 'Rejected by platform admin',
        },
      );

      return savedTech;
    });
  }

  async deleteTechnician(id: string): Promise<{ success: boolean; message: string }> {
    const tech = await this.techRepo.findOne({
      where: { id },
    });
    if (!tech) {
      throw new NotFoundException(`Technician profile not found with ID ${id}`);
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Delete associated technician provider services if any
      await manager.delete(TechnicianProviderService, {
        technicianProfileId: id,
      });

      // 2. Remove technician role assignment
      const role = await manager.findOne(Role, { where: { name: BusinessRole.TECHNICIAN } });
      if (role) {
        await manager.delete(UserRole, {
          userId: tech.userId,
          roleId: role.id,
        });
      }

      // 3. Remove professional application records for technician
      await manager.delete(ProfessionalApplication, {
        userId: tech.userId,
        requestedRole: ProfessionalRole.TECHNICIAN,
      });

      // 4. Delete technician profile
      await manager.remove(tech);

      return {
        success: true,
        message: 'Technician profile deleted successfully',
      };
    });
  }
}
