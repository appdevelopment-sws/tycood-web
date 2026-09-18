import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DriverProfile } from './entities/driver-profile.entity';
import { Vehicle } from './entities/vehicle.entity';
import { DriverVehicle } from './entities/driver-vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { AssignVehicleDto } from './dto/assign-vehicle.dto';
import { QueryDriversDto } from './dto/query-drivers.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { AvailabilityStatus } from '../../common/enums/availability-status.enum';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { DriverVehicleAssignmentStatus, VehicleStatus } from '../../common/enums/vehicle-status.enum';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(DriverVehicle)
    private readonly driverVehicleRepo: Repository<DriverVehicle>,
    private readonly dataSource: DataSource,
  ) {}

  async findByUserId(userId: string): Promise<DriverProfile> {
    const profile = await this.driverRepo.findOne({
      where: { userId },
      relations: {
        user: true,
        driverVehicles: {
          vehicle: true,
        },
      },
    });
    if (!profile) {
      throw new NotFoundException('Driver profile not found for user');
    }
    return profile;
  }

  async updateAvailability(
    userId: string,
    status: AvailabilityStatus,
  ): Promise<DriverProfile> {
    const profile = await this.findByUserId(userId);

    if (
      status === AvailabilityStatus.AVAILABLE &&
      profile.verificationStatus !== VerificationStatus.VERIFIED
    ) {
      throw new ForbiddenException(
        'Driver must be VERIFIED by platform administration before accepting trips or going AVAILABLE',
      );
    }

    if (status === AvailabilityStatus.AVAILABLE) {
      const activeVehicle = profile.driverVehicles?.find(
        (dv) =>
          dv.assignmentStatus === DriverVehicleAssignmentStatus.ASSIGNED &&
          dv.vehicle?.status === VehicleStatus.ACTIVE,
      );
      if (!activeVehicle) {
        throw new ForbiddenException(
          'Driver must have at least one active assigned vehicle before going AVAILABLE',
        );
      }
    }

    profile.availabilityStatus = status;
    return this.driverRepo.save(profile);
  }

  async createVehicle(ownerUserId: string, dto: CreateVehicleDto): Promise<Vehicle> {
    const existing = await this.vehicleRepo.findOne({
      where: { registrationNumber: dto.registrationNumber.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException(
        `Vehicle with registration number ${dto.registrationNumber} already exists`,
      );
    }

    const vehicle = this.vehicleRepo.create({
      ...dto,
      ownerUserId,
      registrationNumber: dto.registrationNumber.toUpperCase(),
    });
    return this.vehicleRepo.save(vehicle);
  }

  async assignVehicle(
    driverProfileId: string,
    dto: AssignVehicleDto,
  ): Promise<DriverVehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id: dto.vehicleId } });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return this.dataSource.transaction(async (manager) => {
      if (dto.isPrimary) {
        await manager.update(
          DriverVehicle,
          { driverProfileId },
          { isPrimary: false },
        );
      }

      let link = await manager.findOne(DriverVehicle, {
        where: { driverProfileId, vehicleId: dto.vehicleId },
      });

      if (link) {
        link.assignmentStatus = DriverVehicleAssignmentStatus.ASSIGNED;
        link.isPrimary = dto.isPrimary ?? true;
        link.unassignedAt = null;
        return manager.save(link);
      }

      link = manager.create(DriverVehicle, {
        driverProfileId,
        vehicleId: dto.vehicleId,
        isPrimary: dto.isPrimary ?? true,
        assignmentStatus: DriverVehicleAssignmentStatus.ASSIGNED,
      });
      return manager.save(link);
    });
  }

  async getMyVehicles(driverProfileId: string): Promise<Vehicle[]> {
    const assignments = await this.driverVehicleRepo.find({
      where: {
        driverProfileId,
        assignmentStatus: DriverVehicleAssignmentStatus.ASSIGNED,
      },
      relations: {
        vehicle: true,
      },
    });

    return assignments.map((a) => a.vehicle);
  }

  async findAll(query: QueryDriversDto): Promise<PaginatedResult<DriverProfile>> {
    const qb = this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.user', 'user')
      .leftJoinAndSelect('driver.driverVehicles', 'dv')
      .leftJoinAndSelect('dv.vehicle', 'vehicle');

    if (query.verificationStatus) {
      qb.andWhere('driver.verificationStatus = :verificationStatus', {
        verificationStatus: query.verificationStatus,
      });
    }

    if (query.availabilityStatus) {
      qb.andWhere('driver.availabilityStatus = :availabilityStatus', {
        availabilityStatus: query.availabilityStatus,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR driver.licenseNumber LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('driver.createdAt', query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    // Mask license numbers for non-admin listing
    const masked = data.map((d) => {
      if (d.licenseNumber && d.licenseNumber.length > 4) {
        d.licenseNumber = `***${d.licenseNumber.slice(-4)}`;
      }
      return d;
    });

    return {
      data: masked,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }
}
