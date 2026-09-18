import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity';
import { UpdateTechnicianProfileDto } from './dto/update-technician-profile.dto';
import { QueryTechniciansDto } from './dto/query-technicians.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AvailabilityStatus } from '../../common/enums/availability-status.enum';
import { VerificationStatus } from '../../common/enums/verification-status.enum';

@Injectable()
export class TechniciansService {
  constructor(
    @InjectRepository(TechnicianProfile)
    private readonly techRepo: Repository<TechnicianProfile>,
  ) {}

  async findByUserId(userId: string): Promise<TechnicianProfile> {
    const profile = await this.techRepo.findOne({
      where: { userId },
      relations: {
        user: true,
      },
    });
    if (!profile) {
      throw new NotFoundException('Technician profile not found for user');
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
}
