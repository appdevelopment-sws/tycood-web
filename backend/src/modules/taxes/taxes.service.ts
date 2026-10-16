import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tax } from './entities/tax.entity.js';
import { CreateTaxDto } from './dto/create-tax.dto.js';
import { UpdateTaxDto } from './dto/update-tax.dto.js';
import { QueryTaxesDto } from './dto/query-taxes.dto.js';
import { TaxType } from './enums/tax-type.enum.js';
import { TaxScope } from './enums/tax-scope.enum.js';

@Injectable()
export class TaxesService {
  private readonly logger = new Logger(TaxesService.name);

  constructor(
    @InjectRepository(Tax)
    private readonly taxRepo: Repository<Tax>,
  ) {}

  async findAll(query?: QueryTaxesDto) {
    const qb = this.taxRepo.createQueryBuilder('tax');

    if (query?.search) {
      qb.andWhere(
        '(LOWER(tax.name) LIKE LOWER(:search) OR LOWER(tax.code) LIKE LOWER(:search))',
        { search: `%${query.search}%` },
      );
    }

    if (query?.taxType) {
      qb.andWhere('tax.taxType = :taxType', { taxType: query.taxType });
    }

    if (query?.applicableOn) {
      qb.andWhere('tax.applicableOn = :applicableOn', {
        applicableOn: query.applicableOn,
      });
    }

    if (query?.isActive !== undefined && query?.isActive !== 'ALL' && query?.isActive !== '') {
      const activeBool = query.isActive === 'true' || query.isActive === '1';
      qb.andWhere('tax.isActive = :isActive', { isActive: activeBool });
    }

    qb.orderBy('tax.priority', 'ASC').addOrderBy('tax.createdAt', 'DESC');

    if (query?.page && query?.limit) {
      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      const [data, total] = await qb.skip(skip).take(limit).getManyAndCount();
      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
        },
      };
    }

    const data = await qb.getMany();
    return data;
  }

  async findOne(id: string): Promise<Tax> {
    const tax = await this.taxRepo.findOne({ where: { id } });
    if (!tax) {
      throw new NotFoundException(`Tax definition with ID "${id}" was not found.`);
    }
    return tax;
  }

  async findActiveTaxes(scope?: TaxScope): Promise<Tax[]> {
    const qb = this.taxRepo
      .createQueryBuilder('tax')
      .where('tax.isActive = :isActive', { isActive: true });

    if (scope) {
      if (scope === TaxScope.TECHNICIAN) {
        qb.andWhere('tax.applicableOn IN (:...scopes)', {
          scopes: [TaxScope.ALL_SERVICES, TaxScope.TECHNICIAN],
        });
      } else if (scope === TaxScope.PARKING) {
        qb.andWhere('tax.applicableOn IN (:...scopes)', {
          scopes: [TaxScope.ALL_SERVICES, TaxScope.PARKING],
        });
      } else if (scope === TaxScope.ALL_RIDES) {
        qb.andWhere('tax.applicableOn IN (:...scopes)', {
          scopes: [TaxScope.ALL_SERVICES, TaxScope.ALL_RIDES],
        });
      } else if (scope === TaxScope.ALL_SERVICES) {
        qb.andWhere('tax.applicableOn = :scope', {
          scope: TaxScope.ALL_SERVICES,
        });
      } else {
        qb.andWhere('tax.applicableOn IN (:...scopes)', {
          scopes: [TaxScope.ALL_SERVICES, TaxScope.ALL_RIDES, scope],
        });
      }
    }

    return qb.orderBy('tax.priority', 'ASC').getMany();
  }

  async create(dto: CreateTaxDto): Promise<Tax> {
    const normalizedCode = dto.code.trim().toUpperCase().replace(/\s+/g, '_');

    const existing = await this.taxRepo.findOne({
      where: { code: normalizedCode },
    });
    if (existing) {
      throw new ConflictException(
        `A tax with code "${normalizedCode}" already exists. Please choose a unique code.`,
      );
    }

    const tax = this.taxRepo.create({
      ...dto,
      code: normalizedCode,
      name: dto.name.trim(),
    });

    return this.taxRepo.save(tax);
  }

  async update(id: string, dto: UpdateTaxDto): Promise<Tax> {
    const tax = await this.findOne(id);

    if (dto.code && dto.code !== tax.code) {
      const normalizedCode = dto.code.trim().toUpperCase().replace(/\s+/g, '_');
      const conflict = await this.taxRepo.findOne({
        where: { code: normalizedCode },
      });
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          `A tax with code "${normalizedCode}" already exists.`,
        );
      }
      tax.code = normalizedCode;
    }

    if (dto.name !== undefined) tax.name = dto.name.trim();
    if (dto.taxType !== undefined) tax.taxType = dto.taxType;
    if (dto.rate !== undefined) tax.rate = dto.rate;
    if (dto.description !== undefined) tax.description = dto.description;
    if (dto.applicableOn !== undefined) tax.applicableOn = dto.applicableOn;
    if (dto.isIncludedInFare !== undefined)
      tax.isIncludedInFare = dto.isIncludedInFare;
    if (dto.isActive !== undefined) tax.isActive = dto.isActive;
    if (dto.priority !== undefined) tax.priority = dto.priority;

    return this.taxRepo.save(tax);
  }

  async toggleActive(id: string, explicitState?: boolean): Promise<Tax> {
    const tax = await this.findOne(id);
    tax.isActive = explicitState !== undefined ? explicitState : !tax.isActive;
    return this.taxRepo.save(tax);
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const tax = await this.findOne(id);
    await this.taxRepo.remove(tax);
    return {
      success: true,
      message: `Tax "${tax.name}" (${tax.code}) has been deleted successfully.`,
    };
  }

  async seedPresets(): Promise<Tax[]> {
    const presets: Partial<Tax>[] = [
      {
        name: 'Platform Convenience Fee',
        code: 'PLATFORM_FEE',
        taxType: TaxType.FIXED,
        rate: 40.0,
        description: 'Standard aggregated platform access, emergency dispatch and technology convenience fee',
        applicableOn: TaxScope.ALL_SERVICES,
        isIncludedInFare: false,
        isActive: true,
        priority: 0,
      },
      {
        name: 'Goods & Services Tax (GST 5%)',
        code: 'GST_5',
        taxType: TaxType.PERCENTAGE,
        rate: 5.0,
        description: 'Standard aggregated transport GST applied to taxi and cab bookings',
        applicableOn: TaxScope.ALL_RIDES,
        isIncludedInFare: false,
        isActive: true,
        priority: 1,
      },
      {
        name: 'Central GST (CGST 2.5%)',
        code: 'CGST_2_5',
        taxType: TaxType.PERCENTAGE,
        rate: 2.5,
        description: 'Central component of statutory Goods & Services Tax',
        applicableOn: TaxScope.ALL_RIDES,
        isIncludedInFare: false,
        isActive: false,
        priority: 2,
      },
      {
        name: 'State GST (SGST 2.5%)',
        code: 'SGST_2_5',
        taxType: TaxType.PERCENTAGE,
        rate: 2.5,
        description: 'State component of statutory Goods & Services Tax',
        applicableOn: TaxScope.ALL_RIDES,
        isIncludedInFare: false,
        isActive: false,
        priority: 3,
      },
      {
        name: 'Airport Convenience & Access Cess',
        code: 'AIRPORT_CESS',
        taxType: TaxType.FIXED,
        rate: 60.0,
        description: 'Fixed terminal toll charge for rides originating or ending at airport terminals',
        applicableOn: TaxScope.AIRPORT_RIDES,
        isIncludedInFare: false,
        isActive: true,
        priority: 4,
      },
      {
        name: 'Night Ride Safety Surcharge (10%)',
        code: 'NIGHT_SURCHARGE_10',
        taxType: TaxType.PERCENTAGE,
        rate: 10.0,
        description: 'Operational peak & security surcharge applied to trips booked between 11:00 PM and 05:00 AM',
        applicableOn: TaxScope.NIGHT_RIDES,
        isIncludedInFare: false,
        isActive: true,
        priority: 5,
      },
      {
        name: 'Interstate State Border Road Tax',
        code: 'STATE_BORDER_TAX',
        taxType: TaxType.FIXED,
        rate: 120.0,
        description: 'Permit entry toll and commercial passenger carrier cess for outstation routes crossing state lines',
        applicableOn: TaxScope.OUTSTATION,
        isIncludedInFare: false,
        isActive: false,
        priority: 6,
      },
    ];

    const results: Tax[] = [];
    for (const p of presets) {
      let tax = await this.taxRepo.findOne({ where: { code: p.code } });
      if (!tax) {
        tax = this.taxRepo.create(p);
        await this.taxRepo.save(tax);
        results.push(tax);
      }
    }

    return this.taxRepo.find({ order: { priority: 'ASC' } });
  }
}
