import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TechnicianCategory } from './entities/technician-category.entity.js';
import { TechnicianServiceCatalogItem } from './entities/technician-service-catalog-item.entity.js';
import { CreateTechnicianCategoryDto } from './dto/create-technician-category.dto.js';
import { UpdateTechnicianCategoryDto } from './dto/update-technician-category.dto.js';
import { CreateTechnicianServiceItemDto } from './dto/create-technician-service-item.dto.js';
import { UpdateTechnicianServiceItemDto } from './dto/update-technician-service-item.dto.js';

@Injectable()
export class TechnicianCategoriesService implements OnModuleInit {
  private readonly logger = new Logger(TechnicianCategoriesService.name);

  constructor(
    @InjectRepository(TechnicianCategory)
    private readonly categoryRepo: Repository<TechnicianCategory>,
    @InjectRepository(TechnicianServiceCatalogItem)
    private readonly serviceItemRepo: Repository<TechnicianServiceCatalogItem>,
  ) {}

  async onModuleInit() {
    await this.seedDefaultCategoriesAndServices();
  }

  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // ==================== CATEGORIES CRUD ====================

  async findAllCategories(includeInactive = false): Promise<TechnicianCategory[]> {
    const qb = this.categoryRepo
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.services', 'service', includeInactive ? '1=1' : 'service.isActive = true')
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('category.createdAt', 'ASC')
      .addOrderBy('service.displayOrder', 'ASC');

    if (!includeInactive) {
      qb.where('category.isActive = :isActive', { isActive: true });
    }

    return qb.getMany();
  }

  async findCategoryById(id: string): Promise<TechnicianCategory> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: { services: true },
    });
    if (!category) {
      throw new NotFoundException(`Category not found with ID ${id}`);
    }
    return category;
  }

  async createCategory(dto: CreateTechnicianCategoryDto): Promise<TechnicianCategory> {
    const slug = this.generateSlug(dto.name);
    const existing = await this.categoryRepo.findOne({ where: [{ name: dto.name }, { slug }] });
    if (existing) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const category = this.categoryRepo.create({
      ...dto,
      slug,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
      isOther: dto.isOther ?? false,
    });

    return this.categoryRepo.save(category);
  }

  async updateCategory(id: string, dto: UpdateTechnicianCategoryDto): Promise<TechnicianCategory> {
    const category = await this.findCategoryById(id);

    if (dto.name && dto.name !== category.name) {
      const slug = this.generateSlug(dto.name);
      const existing = await this.categoryRepo.findOne({ where: { slug } });
      if (existing && existing.id !== id) {
        throw new ConflictException(`Category slug "${slug}" is already in use`);
      }
      category.slug = slug;
    }

    Object.assign(category, dto);
    return this.categoryRepo.save(category);
  }

  async deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
    const category = await this.findCategoryById(id);
    await this.categoryRepo.remove(category);
    return { success: true, message: `Category "${category.name}" removed successfully` };
  }

  // ==================== SERVICE CATALOG ITEMS CRUD ====================

  async findServiceItemById(id: string): Promise<TechnicianServiceCatalogItem> {
    const item = await this.serviceItemRepo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!item) {
      throw new NotFoundException(`Service catalog item not found with ID ${id}`);
    }
    return item;
  }

  async createServiceItem(dto: CreateTechnicianServiceItemDto): Promise<TechnicianServiceCatalogItem> {
    await this.findCategoryById(dto.categoryId);

    const slug = this.generateSlug(dto.name);
    const serviceItem = this.serviceItemRepo.create({
      ...dto,
      slug,
      displayOrder: dto.displayOrder ?? 0,
      isActive: dto.isActive ?? true,
      isInspectionRequired: dto.isInspectionRequired ?? false,
    });

    return this.serviceItemRepo.save(serviceItem);
  }

  async updateServiceItem(id: string, dto: UpdateTechnicianServiceItemDto): Promise<TechnicianServiceCatalogItem> {
    const item = await this.findServiceItemById(id);

    if (dto.categoryId && dto.categoryId !== item.categoryId) {
      await this.findCategoryById(dto.categoryId);
    }

    if (dto.name && dto.name !== item.name) {
      item.slug = this.generateSlug(dto.name);
    }

    Object.assign(item, dto);
    return this.serviceItemRepo.save(item);
  }

  async deleteServiceItem(id: string): Promise<{ success: boolean; message: string }> {
    const item = await this.findServiceItemById(id);
    await this.serviceItemRepo.remove(item);
    return { success: true, message: `Service item "${item.name}" removed successfully` };
  }

  // ==================== DEFAULT SEEDING ====================

  async seedDefaultCategoriesAndServices() {
    const existingCount = await this.categoryRepo.count();
    if (existingCount > 0) {
      return;
    }

    this.logger.log('Seeding initial Technician Categories & Standard Services catalog...');

    const defaultCatalog = [
      {
        name: 'Battery & Jumpstart',
        description: 'Dead battery jumpstarts, health scans, and emergency power support.',
        icon: 'BatteryCharging',
        isOther: false,
        displayOrder: 1,
        services: [
          {
            name: 'Battery Jumpstart',
            description: 'Heavy-duty booster cable jumpstart with charging alternator check',
            estimatedDurationMinutes: 25,
            isInspectionRequired: false,
            displayOrder: 1,
          },
          {
            name: 'Battery Diagnostics & Health Scan',
            description: 'Digital conductance scan measuring CCA, state of health, and alternator output',
            estimatedDurationMinutes: 20,
            isInspectionRequired: false,
            displayOrder: 2,
          },
          {
            name: 'Terminal Cleaning & Cable Repair',
            description: 'Removal of severe corrosion, terminal clamp tightening, and anti-sulfate spray',
            estimatedDurationMinutes: 20,
            isInspectionRequired: false,
            displayOrder: 3,
          },
        ],
      },
      {
        name: 'Tires & Wheels',
        description: 'Puncture repair, spare stepney wheel swap, and high-pressure air fill.',
        icon: 'Disc',
        isOther: false,
        displayOrder: 2,
        services: [
          {
            name: 'Tubeless Tire Puncture Repair',
            description: 'On-site tire leak detection, rubber plug insertion, and pressure rebalancing',
            estimatedDurationMinutes: 25,
            isInspectionRequired: false,
            displayOrder: 1,
          },
          {
            name: 'Spare Stepney Replacement',
            description: 'Hydraulic jack vehicle lift, flat wheel removal, and spare tire installation with torque wrench',
            estimatedDurationMinutes: 25,
            isInspectionRequired: false,
            displayOrder: 2,
          },
          {
            name: 'Emergency Air Pressure Fill',
            description: 'Portable heavy-duty compressor inflation to OEM PSI specifications',
            estimatedDurationMinutes: 15,
            isInspectionRequired: false,
            displayOrder: 3,
          },
        ],
      },
      {
        name: 'Engine & Mechanical',
        description: 'Engine overheating, belt snaps, fluid leaks, and mechanical breakdowns.',
        icon: 'Gauge',
        isOther: false,
        displayOrder: 3,
        services: [
          {
            name: 'On-Site Engine OBD-II Computer Scan',
            description: 'ECU trouble code extraction, live sensor reading, and fault identification',
            estimatedDurationMinutes: 35,
            isInspectionRequired: false,
            displayOrder: 1,
          },
          {
            name: 'Coolant Hose & Overheating Assistance',
            description: 'Emergency coolant top-up, radiator hose leak inspection, and air pocket bleeding',
            estimatedDurationMinutes: 40,
            isInspectionRequired: false,
            displayOrder: 2,
          },
          {
            name: 'Alternator / Serpentine Belt Tightening',
            description: 'Tensioner adjustment and minor mechanical belt realignment',
            estimatedDurationMinutes: 45,
            isInspectionRequired: false,
            displayOrder: 3,
          },
        ],
      },
      {
        name: 'Lockout & Emergency Fuel',
        description: 'Locked out of vehicle or run out of petrol/diesel on the road.',
        icon: 'Key',
        isOther: false,
        displayOrder: 4,
        services: [
          {
            name: 'Vehicle Door Unlock (Key Inside)',
            description: 'Safe non-destructive pneumatic wedge and linkage tool entry for locked vehicles',
            estimatedDurationMinutes: 30,
            isInspectionRequired: false,
            displayOrder: 1,
          },
          {
            name: 'Emergency Fuel Delivery (5 Litres)',
            description: 'Delivery of 5L certified fuel canister to stranded vehicle location',
            estimatedDurationMinutes: 25,
            isInspectionRequired: false,
            displayOrder: 2,
          },
        ],
      },
      {
        name: 'Other / Unaware of Issue',
        description: 'Not sure what is wrong? Select this for diagnostic inspection and customized mechanic quotation.',
        icon: 'HelpCircle',
        isOther: true,
        displayOrder: 99,
        services: [
          {
            name: 'Comprehensive On-Site Vehicle Inspection',
            description: 'Full 30-point mechanical and electrical visual inspection with custom quote by technician',
            estimatedDurationMinutes: 45,
            isInspectionRequired: true,
            displayOrder: 1,
          },
          {
            name: 'Custom Breakdown Diagnostic (Provider Quote)',
            description: 'Mechanic examines vehicle and submits tailored repair quotation through provider app',
            estimatedDurationMinutes: 30,
            isInspectionRequired: true,
            displayOrder: 2,
          },
        ],
      },
    ];

    for (const catData of defaultCatalog) {
      const { services, ...catFields } = catData;
      const category = this.categoryRepo.create({
        ...catFields,
        slug: this.generateSlug(catFields.name),
        isActive: true,
      });
      const savedCat = await this.categoryRepo.save(category);

      for (const srvData of services) {
        const srv = this.serviceItemRepo.create({
          ...srvData,
          categoryId: savedCat.id,
          slug: this.generateSlug(srvData.name),
          isActive: true,
        });
        await this.serviceItemRepo.save(srv);
      }
    }

    this.logger.log('Technician Categories & Services catalog seeded successfully.');
  }
}
