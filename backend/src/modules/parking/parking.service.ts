import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParkingOperator } from './entities/parking-operator.entity';
import { ParkingLocation } from './entities/parking-location.entity';
import { CreateParkingLocationDto } from './dto/create-parking-location.dto';
import { UpdateParkingLocationDto } from './dto/update-parking-location.dto';
import { UpdateParkingInventoryDto } from './dto/update-parking-inventory.dto';
import { QueryParkingLocationsDto } from './dto/query-parking-locations.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { ParkingLocationStatus } from '../../common/enums/parking-status.enum';
import { BusinessRole } from '../../common/enums/business-role.enum';
import { ICurrentUser } from '../../common/interfaces/current-user.interface';

@Injectable()
export class ParkingService {
  constructor(
    @InjectRepository(ParkingOperator)
    private readonly operatorRepo: Repository<ParkingOperator>,
    @InjectRepository(ParkingLocation)
    private readonly locationRepo: Repository<ParkingLocation>,
  ) {}

  async findOperatorByUserId(userId: string): Promise<ParkingOperator> {
    const operator = await this.operatorRepo.findOne({
      where: { userId },
      relations: {
        user: true,
        locations: true,
      },
    });
    if (!operator) {
      throw new NotFoundException('Parking operator profile not found for user');
    }
    return operator;
  }

  async createLocation(
    userId: string,
    dto: CreateParkingLocationDto,
  ): Promise<ParkingLocation> {
    const operator = await this.findOperatorByUserId(userId);

    if (operator.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Operator must be VERIFIED before managing active parking locations or inventory',
      );
    }

    const totalCapacity = dto.carSlotsTotal + dto.bikeSlotsTotal;
    const location = this.locationRepo.create({
      ...dto,
      operatorId: operator.id,
      capacity: totalCapacity,
      availableSpaces: totalCapacity,
      availableCarSlots: dto.carSlotsTotal,
      availableBikeSlots: dto.bikeSlotsTotal,
      status: ParkingLocationStatus.ACTIVE,
    });

    return this.locationRepo.save(location);
  }

  async updateLocation(
    locationId: string,
    user: ICurrentUser,
    dto: UpdateParkingLocationDto,
  ): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({
      where: { id: locationId },
      relations: {
        operator: true,
      },
    });
    if (!location) {
      throw new NotFoundException('Parking location not found');
    }

    // Verify ownership or admin permission
    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException('Unauthorized: You cannot modify this parking facility');
    }

    if (dto.carSlotsTotal !== undefined || dto.bikeSlotsTotal !== undefined) {
      const newCarTotal = dto.carSlotsTotal ?? location.carSlotsTotal;
      const newBikeTotal = dto.bikeSlotsTotal ?? location.bikeSlotsTotal;
      location.carSlotsTotal = newCarTotal;
      location.bikeSlotsTotal = newBikeTotal;
      location.capacity = newCarTotal + newBikeTotal;
      location.availableCarSlots = Math.min(location.availableCarSlots, newCarTotal);
      location.availableBikeSlots = Math.min(location.availableBikeSlots, newBikeTotal);
      location.availableSpaces = location.availableCarSlots + location.availableBikeSlots;
    }

    Object.assign(location, dto);
    return this.locationRepo.save(location);
  }

  async updateInventory(
    locationId: string,
    user: ICurrentUser,
    dto: UpdateParkingInventoryDto,
  ): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({
      where: { id: locationId },
      relations: {
        operator: true,
      },
    });
    if (!location) {
      throw new NotFoundException('Parking location not found');
    }

    // Gating: Only approved operator or admin can update inventory
    const isAdmin =
      user.roles.includes(BusinessRole.ADMIN) ||
      user.roles.includes(BusinessRole.SUPER_ADMIN);
    if (!isAdmin && location.operator.userId !== user.userId) {
      throw new ForbiddenException(
        'Unauthorized: You are not authorized to update inventory for this facility',
      );
    }

    if (location.operator.verificationStatus !== VerificationStatus.VERIFIED) {
      throw new ForbiddenException(
        'Unapproved parking operator cannot manage active parking inventory',
      );
    }

    // Calculate new car slots
    let newCarSlots = location.availableCarSlots;
    if (dto.availableCarSlots !== undefined) {
      newCarSlots = dto.availableCarSlots;
    } else if (dto.carDelta !== undefined) {
      newCarSlots += dto.carDelta;
    }

    // Calculate new bike slots
    let newBikeSlots = location.availableBikeSlots;
    if (dto.availableBikeSlots !== undefined) {
      newBikeSlots = dto.availableBikeSlots;
    } else if (dto.bikeDelta !== undefined) {
      newBikeSlots += dto.bikeDelta;
    }

    // Validate boundaries
    if (newCarSlots < 0) {
      throw new BadRequestException('Available car slots cannot be negative');
    }
    if (newCarSlots > location.carSlotsTotal) {
      throw new BadRequestException(
        `Available car slots (${newCarSlots}) cannot exceed total capacity (${location.carSlotsTotal})`,
      );
    }

    if (newBikeSlots < 0) {
      throw new BadRequestException('Available bike slots cannot be negative');
    }
    if (newBikeSlots > location.bikeSlotsTotal) {
      throw new BadRequestException(
        `Available bike slots (${newBikeSlots}) cannot exceed total capacity (${location.bikeSlotsTotal})`,
      );
    }

    location.availableCarSlots = newCarSlots;
    location.availableBikeSlots = newBikeSlots;
    location.availableSpaces = newCarSlots + newBikeSlots;

    if (location.availableSpaces === 0) {
      location.status = ParkingLocationStatus.FULL;
    } else if (location.status === ParkingLocationStatus.FULL) {
      location.status = ParkingLocationStatus.ACTIVE;
    }

    return this.locationRepo.save(location);
  }

  async getMyLocations(userId: string): Promise<ParkingLocation[]> {
    const operator = await this.findOperatorByUserId(userId);
    return this.locationRepo.find({
      where: { operatorId: operator.id },
      order: { createdAt: 'DESC' },
    });
  }

  async findLocationById(id: string): Promise<ParkingLocation> {
    const location = await this.locationRepo.findOne({
      where: { id },
      relations: {
        operator: true,
      },
    });
    if (!location) {
      throw new NotFoundException('Parking location not found');
    }
    return location;
  }

  async findAll(query: QueryParkingLocationsDto): Promise<PaginatedResult<ParkingLocation>> {
    const qb = this.locationRepo
      .createQueryBuilder('loc')
      .leftJoinAndSelect('loc.operator', 'operator');

    if (query.status) {
      qb.andWhere('loc.status = :status', { status: query.status });
    }

    if (query.city) {
      qb.andWhere('LOWER(loc.city) = LOWER(:city)', { city: query.city });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(loc.name) LIKE LOWER(:search) OR LOWER(loc.address) LIKE LOWER(:search) OR LOWER(loc.landmark) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('loc.createdAt', query.sortOrder || 'DESC');
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
