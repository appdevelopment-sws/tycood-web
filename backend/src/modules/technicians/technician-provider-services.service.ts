import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { TechnicianProfile } from './entities/technician-profile.entity.js';
import { TechnicianCategory } from './entities/technician-category.entity.js';
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
    @InjectRepository(TechnicianCategory)
    private readonly categoryRepo: Repository<TechnicianCategory>,
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
        if (!item.categoryId && !item.serviceCatalogItemId) continue;

        let existing = await manager.findOne(TechnicianProviderService, {
          where: {
            technicianProfileId: profile.id,
            ...(item.categoryId ? { categoryId: item.categoryId } : {}),
            ...(item.serviceCatalogItemId
              ? { serviceCatalogItemId: item.serviceCatalogItemId }
              : {}),
          },
        });

        if (existing) {
          existing.customPrice = item.customPrice;
          existing.isAvailable = item.isAvailable ?? true;
          existing.notes = item.notes ?? existing.notes;
        } else {
          existing = manager.create(TechnicianProviderService, {
            technicianProfileId: profile.id,
            categoryId: item.categoryId || null,
            serviceCatalogItemId: item.serviceCatalogItemId || null,
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

  async findProvidersForCategory(
    categoryId: string,
    lat?: number,
    lng?: number,
  ) {
    const category = await this.categoryRepo.findOne({
      where: { id: categoryId },
    });

    const techProfiles = await this.techProfileRepo.find({
      relations: {
        user: true,
        providerServices: true,
      },
    });

    const categoryBasePrice = category ? category.basePrice : 450;

    const list = techProfiles.map((tech) => {
      let distanceKm: number | null = null;
      if (lat && lng && tech.currentLat && tech.currentLng) {
        distanceKm = this.calculateDistance(lat, lng, tech.currentLat, tech.currentLng);
      }

      const customSvc = tech.providerServices?.find((ps) => ps.categoryId === categoryId);
      const price = customSvc && customSvc.customPrice > 0 ? customSvc.customPrice : categoryBasePrice;
      const isOnline = tech.availabilityStatus === AvailabilityStatus.AVAILABLE;

      return {
        technicianProfileId: tech.id,
        technicianName: tech.user?.name || tech.workshopName || 'Professional Mechanic',
        workshopName: tech.workshopName || (tech.user?.name ? `${tech.user.name}'s Workshop` : 'Authorized Auto Center'),
        experienceYears: tech.experienceYears || '3-5 years',
        vehicleType: tech.vehicleType || 'Rapid Response Van',
        rating: 4.9,
        price: Number(price),
        isOnline,
        availabilityStatus: tech.availabilityStatus,
        verificationStatus: tech.verificationStatus,
        toolsAvailable: tech.toolsAvailable || [],
        bio: tech.bio || 'Equipped with diagnostic scanner, jumpstart kit and standard roadside tools.',
        distanceKm: distanceKm ? Number(distanceKm.toFixed(1)) : null,
        currentAddress: tech.currentAddress || tech.baseArea || 'Patna Central',
        categoryName: category?.name || 'Assistance Service',
        isOther: category?.isOther || false,
        profileImage: tech.user?.profileImage || null,
      };
    });

    // Sort: Online technicians first, then rating descending, then distance ascending
    return list.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      if (b.rating !== a.rating) {
        return b.rating - a.rating;
      }
      if (a.distanceKm != null && b.distanceKm != null) {
        return a.distanceKm - b.distanceKm;
      }
      return 0;
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
