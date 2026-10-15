import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { TechnicianServiceCatalogItem } from './entities/technician-service-catalog-item.entity.js';
import { TechnicianProviderService } from './entities/technician-provider-service.entity.js';
import { ConfigureProviderServicesDto } from './dto/configure-provider-services.dto.js';
import { AvailabilityStatus } from '../../common/enums/availability-status.enum.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';

@Injectable()
export class TechnicianProviderServicesService {
  constructor(
    @InjectRepository(TechnicianProfile)
    private readonly techProfileRepo: Repository<TechnicianProfile>,
    @InjectRepository(TechnicianServiceCatalogItem)
    private readonly serviceItemRepo: Repository<TechnicianServiceCatalogItem>,
    @InjectRepository(TechnicianProviderService)
    private readonly providerServiceRepo: Repository<TechnicianProviderService>,
    private readonly dataSource: DataSource,
  ) {}

  private async getProfileByUserId(userId: string): Promise<TechnicianProfile> {
    const profile = await this.techProfileRepo.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException('Technician profile not found for user');
    }
    return profile;
  }

  async getMyServices(userId: string) {
    const profile = await this.getProfileByUserId(userId);

    const providerServices = await this.providerServiceRepo.find({
      where: { technicianProfileId: profile.id },
      relations: {
        serviceCatalogItem: {
          category: true,
        },
      },
      order: {
        createdAt: 'ASC',
      },
    });

    return providerServices;
  }

  async configureMyServices(userId: string, dto: ConfigureProviderServicesDto) {
    const profile = await this.getProfileByUserId(userId);

    if (!dto.services || dto.services.length === 0) {
      throw new BadRequestException('At least one service must be configured');
    }

    return this.dataSource.transaction(async (manager) => {
      // Validate all service catalog item IDs exist and are active
      const updatedList: TechnicianProviderService[] = [];

      for (const item of dto.services) {
        const catalogItem = await manager.findOne(TechnicianServiceCatalogItem, {
          where: { id: item.serviceCatalogItemId, isActive: true },
        });

        if (!catalogItem) {
          throw new NotFoundException(
            `Catalog service item not found or inactive: ${item.serviceCatalogItemId}`,
          );
        }

        let existing = await manager.findOne(TechnicianProviderService, {
          where: {
            technicianProfileId: profile.id,
            serviceCatalogItemId: item.serviceCatalogItemId,
          },
        });

        if (existing) {
          existing.customPrice = item.customPrice;
          existing.isAvailable = item.isAvailable ?? true;
          existing.notes = item.notes ?? existing.notes;
        } else {
          existing = manager.create(TechnicianProviderService, {
            technicianProfileId: profile.id,
            serviceCatalogItemId: item.serviceCatalogItemId,
            customPrice: item.customPrice,
            isAvailable: item.isAvailable ?? true,
            notes: item.notes,
          });
        }

        const saved = await manager.save(existing);
        updatedList.push(saved);
      }

      return updatedList;
    });
  }

  async findAvailableProvidersForService(
    serviceCatalogItemId: string,
    lat?: number,
    lng?: number,
  ) {
    const qb = this.providerServiceRepo
      .createQueryBuilder('ps')
      .innerJoinAndSelect('ps.technicianProfile', 'tech')
      .innerJoinAndSelect('tech.user', 'user')
      .innerJoinAndSelect('ps.serviceCatalogItem', 'item')
      .where('ps.serviceCatalogItemId = :serviceCatalogItemId', { serviceCatalogItemId })
      .andWhere('ps.isAvailable = true')
      .andWhere('tech.verificationStatus = :vStatus', { vStatus: VerificationStatus.VERIFIED })
      .andWhere('tech.availabilityStatus = :aStatus', { aStatus: AvailabilityStatus.AVAILABLE });

    const providers = await qb.getMany();

    // Map and calculate approximate distance if coordinates are provided
    return providers.map((ps) => {
      let distanceKm: number | null = null;
      if (lat && lng && ps.technicianProfile.currentLat && ps.technicianProfile.currentLng) {
        distanceKm = this.calculateDistance(
          lat,
          lng,
          ps.technicianProfile.currentLat,
          ps.technicianProfile.currentLng,
        );
      }

      return {
        providerServiceId: ps.id,
        technicianProfileId: ps.technicianProfile.id,
        technicianName: ps.technicianProfile.user?.name || 'Mechanic',
        workshopName: ps.technicianProfile.workshopName,
        experienceYears: ps.technicianProfile.experienceYears,
        vehicleType: ps.technicianProfile.vehicleType,
        rating: 4.9, // Dynamic rating calculation or snapshot
        customPrice: ps.customPrice,
        notes: ps.notes,
        distanceKm: distanceKm ? Number(distanceKm.toFixed(1)) : null,
        currentAddress: ps.technicianProfile.currentAddress,
      };
    });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
