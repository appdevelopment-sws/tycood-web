import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TruckType } from './entities/truck-type.entity';
import { Load } from './entities/load.entity';
import { LoadBid } from './entities/load-bid.entity';
import { TruckBodyType, LoadStatus, PaymentTerms, BidStatus } from './enums/logistics.enums';
import { CreateTruckTypeDto, UpdateTruckTypeDto } from './dto/truck-type.dto';
import { CreateLoadDto, UpdateLoadDto, CreateLoadBidDto } from './dto/load.dto';
import { QueryTruckTypesDto, QueryLoadsDto } from './dto/query-logistics.dto';

@Injectable()
export class LogisticsService implements OnModuleInit {
  private readonly logger = new Logger(LogisticsService.name);

  constructor(
    @InjectRepository(TruckType)
    private readonly truckTypeRepo: Repository<TruckType>,
    @InjectRepository(Load)
    private readonly loadRepo: Repository<Load>,
    @InjectRepository(LoadBid)
    private readonly bidRepo: Repository<LoadBid>,
  ) {}

  async onModuleInit() {
    await this.seedInitialLogisticsData();
  }

  // =========================================================================
  // TRUCK TYPES MANAGEMENT (ADMIN + USER APP FILTERS)
  // =========================================================================

  async getTruckTypes(query: QueryTruckTypesDto) {
    const qb = this.truckTypeRepo.createQueryBuilder('tt');

    if (query.search) {
      qb.andWhere(
        '(LOWER(tt.name) LIKE :s OR LOWER(tt.category) LIKE :s OR LOWER(tt.dimensionLabel) LIKE :s)',
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.category && query.category !== 'ALL') {
      qb.andWhere('LOWER(tt.category) = LOWER(:cat)', { cat: query.category });
    }

    if (query.isActive !== undefined) {
      const active = query.isActive === 'true';
      qb.andWhere('tt.isActive = :active', { active });
    }

    qb.orderBy('tt.sortOrder', 'ASC').addOrderBy('tt.name', 'ASC');

    const page = query.page || 1;
    const limit = query.limit || 50;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTruckTypeById(id: string): Promise<TruckType> {
    const item = await this.truckTypeRepo.findOne({ where: { id } });
    if (!item) {
      throw new NotFoundException(`Truck type with ID ${id} not found`);
    }
    return item;
  }

  async createTruckType(dto: CreateTruckTypeDto): Promise<TruckType> {
    const entity = this.truckTypeRepo.create({
      ...dto,
      dimensionLabel:
        dto.dimensionLabel ||
        `${dto.lengthFt || 28}ft x ${dto.widthFt || 8}ft ${dto.name}`,
    });
    return this.truckTypeRepo.save(entity);
  }

  async updateTruckType(id: string, dto: UpdateTruckTypeDto): Promise<TruckType> {
    const item = await this.getTruckTypeById(id);
    Object.assign(item, dto);
    if (!dto.dimensionLabel && (dto.lengthFt || dto.widthFt)) {
      item.dimensionLabel = `${item.lengthFt}ft x ${item.widthFt}ft ${item.name}`;
    }
    return this.truckTypeRepo.save(item);
  }

  async deleteTruckType(id: string): Promise<{ success: boolean; message: string }> {
    const item = await this.getTruckTypeById(id);
    await this.truckTypeRepo.remove(item);
    return { success: true, message: 'Truck type deleted successfully' };
  }

  // =========================================================================
  // CARGO LOADS (FREIGHT MARKETPLACE)
  // =========================================================================

  async getLoads(query: QueryLoadsDto) {
    const qb = this.loadRepo
      .createQueryBuilder('l')
      .leftJoinAndSelect('l.truckType', 'tt');

    if (query.search) {
      qb.andWhere(
        '(LOWER(l.product) LIKE :s OR LOWER(l.pickupCity) LIKE :s OR LOWER(l.unloadingCity) LIKE :s OR LOWER(l.transporterCompany) LIKE :s)',
        { s: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.pickupCity && query.pickupCity !== 'ALL') {
      qb.andWhere('LOWER(l.pickupCity) = LOWER(:pc)', { pc: query.pickupCity });
    }

    if (query.unloadingCity && query.unloadingCity !== 'ALL') {
      qb.andWhere('LOWER(l.unloadingCity) = LOWER(:uc)', { uc: query.unloadingCity });
    }

    if (query.truckCategory && query.truckCategory !== 'ALL') {
      qb.andWhere('LOWER(l.requiredTruckCategory) = LOWER(:tc)', { tc: query.truckCategory });
    }

    if (query.minFeet) {
      qb.andWhere('l.requiredMinLengthFt >= :mf', { mf: query.minFeet });
    }

    if (query.minTons) {
      qb.andWhere('l.totalLoadNumber >= :mt', { mt: query.minTons });
    }

    if (query.status) {
      qb.andWhere('l.status = :st', { st: query.status });
    } else {
      qb.andWhere('l.status = :st', { st: LoadStatus.OPEN });
    }

    qb.orderBy('l.createdAt', 'DESC');

    const page = query.page || 1;
    const limit = query.limit || 30;
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getLoadById(id: string): Promise<Load> {
    const load = await this.loadRepo.findOne({
      where: { id },
      relations: { truckType: true, bids: true },
    });
    if (!load) {
      throw new NotFoundException(`Load with ID ${id} not found`);
    }
    return load;
  }

  async createLoad(dto: CreateLoadDto): Promise<Load> {
    const loadNumber =
      dto.loadNumber ||
      `LD-${Math.floor(1000 + Math.random() * 9000)}`;

    const entity = this.loadRepo.create({
      ...dto,
      loadNumber,
    });

    return this.loadRepo.save(entity);
  }

  async updateLoad(id: string, dto: UpdateLoadDto): Promise<Load> {
    const load = await this.getLoadById(id);
    Object.assign(load, dto);
    return this.loadRepo.save(load);
  }

  async deleteLoad(id: string): Promise<{ success: boolean; message: string }> {
    const load = await this.getLoadById(id);
    await this.loadRepo.remove(load);
    return { success: true, message: 'Load deleted successfully' };
  }

  // =========================================================================
  // DRIVER BIDS
  // =========================================================================

  async placeBid(loadId: string, dto: CreateLoadBidDto, driverUserId?: string): Promise<LoadBid> {
    const load = await this.getLoadById(loadId);
    if (load.status !== LoadStatus.OPEN) {
      throw new BadRequestException('Bidding is closed for this load');
    }

    const bid = this.bidRepo.create({
      loadId,
      driverUserId,
      driverName: dto.driverName,
      driverPhone: dto.driverPhone,
      proposedRate: dto.proposedRate,
      vehicleNumber: dto.vehicleNumber,
      vehicleType: dto.vehicleType,
      notes: dto.notes,
      status: BidStatus.PENDING,
    });

    return this.bidRepo.save(bid);
  }

  // =========================================================================
  // SEED INITIAL REALISTIC LOGISTICS DATA (PATNA / BIHAR REGION)
  // =========================================================================

  private async seedInitialLogisticsData() {
    try {
      const count = await this.truckTypeRepo.count();
      if (count > 0) return;

      this.logger.log('Seeding initial Indian Freight Truck Types and Regional Loads...');

      const initialTruckTypes: Partial<TruckType>[] = [
        {
          name: 'Open Half/Full Body',
          category: 'Open',
          bodyType: TruckBodyType.OPEN_HALF_BODY,
          lengthFt: 28,
          widthFt: 8,
          heightFt: 7.5,
          dimensionLabel: '28ft Open Body (High Bed)',
          minTons: 7.5,
          maxTons: 43.0,
          capacityRange: '7.5 - 43 Ton',
          wheelsNumber: 14,
          wheelCount: '14 Wheeler',
          suitableMaterials: [
            'Ata chokar & Grains',
            'Cement & Bulker Goods',
            'TMT Iron Rods & Structural Steel (up to 28ft)',
            'Fertilizers & Sugar',
          ],
          sortOrder: 1,
          isActive: true,
          description: 'Heavy duty multi-axle open truck for bulk industrial and agricultural haulage',
        },
        {
          name: 'Closed Container',
          category: 'Container',
          bodyType: TruckBodyType.CONTAINER,
          lengthFt: 32,
          widthFt: 8,
          heightFt: 8.5,
          dimensionLabel: '32ft Single/Multi Axle Container',
          minTons: 7.5,
          maxTons: 30.0,
          capacityRange: '7.5 - 30 Ton',
          wheelsNumber: 10,
          wheelCount: '10 Wheeler',
          suitableMaterials: [
            'FMCG & Packaged Foods',
            'Electronics & Appliances',
            'Pharmaceuticals',
            'E-commerce Cargo',
          ],
          sortOrder: 2,
          isActive: true,
          description: 'Weatherproof sealed container ensuring zero moisture damage for sensitive freight',
        },
        {
          name: 'LCV (Light Commercial)',
          category: 'LCV',
          bodyType: TruckBodyType.LCV,
          lengthFt: 14,
          widthFt: 7,
          heightFt: 6,
          dimensionLabel: '14ft / 17ft LCV Eicher',
          minTons: 2.5,
          maxTons: 7.0,
          capacityRange: '2.5 - 7 Ton',
          wheelsNumber: 6,
          wheelCount: '6 Wheeler',
          suitableMaterials: [
            'Wholesale Market Goods',
            'Plywood & Timber',
            'Hardware & Small Machines',
          ],
          sortOrder: 3,
          isActive: true,
          description: 'Agile medium-load carrier perfect for intercity state highways and feeder routes',
        },
        {
          name: 'Mini / Pickup',
          category: 'Mini/Pickup',
          bodyType: TruckBodyType.MINI_PICKUP,
          lengthFt: 9,
          widthFt: 5,
          heightFt: 5,
          dimensionLabel: 'Tata Ace / Bolero Pickup',
          minTons: 0.75,
          maxTons: 2.0,
          capacityRange: '0.75 - 2 Ton',
          wheelsNumber: 4,
          wheelCount: '4 Wheeler',
          suitableMaterials: [
            'Cartons & Small Parcels',
            'Local Market Distribution',
            'Pipes (up to 10ft)',
          ],
          sortOrder: 4,
          isActive: true,
          description: 'Last-mile urban and rural delivery vehicle',
        },
        {
          name: 'Flatbed Trailer (Long Length)',
          category: 'Trailer',
          bodyType: TruckBodyType.FLATBED,
          lengthFt: 40,
          widthFt: 8.5,
          heightFt: 5,
          dimensionLabel: '40ft Flatbed Long Bed',
          minTons: 16.0,
          maxTons: 43.0,
          capacityRange: '16 - 43 Ton',
          wheelsNumber: 18,
          wheelCount: '18 Wheeler',
          suitableMaterials: [
            '40ft TMT Rebars & Long Iron Rods',
            'Long Industrial Steel Pipes',
            'Heavy Machinery & Turbines',
            'Precast Concrete Beams',
          ],
          sortOrder: 5,
          isActive: true,
          description: 'Unrestricted flat deck trailer specifically designed for long structural steel and 40ft iron rods',
        },
        {
          name: 'Tipper (Hydraulic Dump)',
          category: 'Tipper',
          bodyType: TruckBodyType.TIPPER,
          lengthFt: 22,
          widthFt: 8,
          heightFt: 6.5,
          dimensionLabel: '22ft Hydraulic Tipper Box',
          minTons: 9.0,
          maxTons: 30.0,
          capacityRange: '9 - 30 Ton',
          wheelsNumber: 12,
          wheelCount: '12 Wheeler',
          suitableMaterials: [
            'River Sand (Balu)',
            'Crushed Stone & Aggregates',
            'Fly Ash',
            'Earth & Soil',
          ],
          sortOrder: 6,
          isActive: true,
          description: 'Hydraulic tipping mechanism for rapid unloading of loose construction aggregates',
        },
        {
          name: 'Liquid Tanker',
          category: 'Tanker',
          bodyType: TruckBodyType.TANKER,
          lengthFt: 28,
          widthFt: 8,
          heightFt: 8,
          dimensionLabel: '24KL - 36KL Insulated Tanker',
          minTons: 8.0,
          maxTons: 36.0,
          capacityRange: '8 - 36 Ton',
          wheelsNumber: 14,
          wheelCount: '14 Wheeler',
          suitableMaterials: [
            'Edible Oil',
            'Petroleum & Diesel',
            'Chemicals & Solvents',
            'Milk & Liquid Foodstuff',
          ],
          sortOrder: 7,
          isActive: true,
          description: 'Food-grade or hazardous chemical certified liquid containment barrels',
        },
        {
          name: 'Dumper',
          category: 'Dumper',
          bodyType: TruckBodyType.DUMPER,
          lengthFt: 24,
          widthFt: 8,
          heightFt: 7,
          dimensionLabel: 'Heavy Mining Dumper',
          minTons: 9.0,
          maxTons: 36.0,
          capacityRange: '9 - 36 Ton',
          wheelsNumber: 12,
          wheelCount: '12 Wheeler',
          suitableMaterials: ['Mining Ores', 'Heavy Rock Boulders', 'Excavation Debris'],
          sortOrder: 8,
          isActive: true,
          description: 'Reinforced rock body for rugged quarry and excavation jobs',
        },
        {
          name: 'Cement Bulker',
          category: 'Bulker',
          bodyType: TruckBodyType.BULKER,
          lengthFt: 30,
          widthFt: 8,
          heightFt: 9,
          dimensionLabel: 'Pressurized Pneumatic Bulker',
          minTons: 20.0,
          maxTons: 36.0,
          capacityRange: '20 - 36 Ton',
          wheelsNumber: 16,
          wheelCount: '16 Wheeler',
          suitableMaterials: ['Loose Dry Cement', 'Dry Fly Ash', 'Plastic Granules'],
          sortOrder: 9,
          isActive: true,
          description: 'Pneumatic discharge tank for ready-mix concrete plants and cement silos',
        },
      ];

      const savedTruckTypes = await this.truckTypeRepo.save(
        initialTruckTypes.map((t) => this.truckTypeRepo.create(t)),
      );

      const openType = savedTruckTypes.find((t) => t.category === 'Open');
      const trailerType = savedTruckTypes.find((t) => t.category === 'Trailer');
      const lcvType = savedTruckTypes.find((t) => t.category === 'LCV');

      // Seed realistic loads matching user's screenshots
      const initialLoads: Partial<Load>[] = [
        {
          loadNumber: 'LD-9281',
          pickupCity: 'Durgawati',
          pickupState: 'Bihar',
          pickupAddress: 'Durgawati Grain Mandi, NH-19 Bypass',
          unloadingCity: 'Bihta',
          unloadingState: 'Bihar',
          unloadingAddress: 'Bihta Agro Processing Hub, Bihar',
          addressNote: 'Address will be shared on call',
          distanceKm: 160.0,
          product: 'Ata chokar',
          productCategory: 'Agro / Grains',
          productLengthFt: 0,
          totalLoadTons: '29-30 ton',
          totalLoadNumber: 30.0,
          truckTypeId: openType?.id,
          requiredTruckCategory: 'Open',
          requiredTruckTypeDesc: 'Open Half/Full Body',
          requiredWheels: '14 Wheeler',
          requiredMinLengthFt: 28,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 19000.0,
          isRateNegotiable: true,
          pricingNote: 'Full amount will be paid to the driver at the unloading point',
          transporterName: 'SKAND KUMAR',
          transporterCompany: 'RAJASTHAN GUJARAT ROADWAYS',
          transporterPhone: '+91 94310 88291',
          transporterRating: 3.0,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
          instructions: 'Standard tarp cover required. Loading begins 3:00 PM today.',
        },
        {
          loadNumber: 'LD-9282',
          pickupCity: 'Fatwah',
          pickupState: 'Bihar',
          pickupAddress: 'Fatwah Industrial Growth Centre',
          unloadingCity: 'Bihta',
          unloadingState: 'Bihar',
          unloadingAddress: 'Bihta Mega Food Park, Patna Outer',
          addressNote: 'Address will be shared on call',
          distanceKm: 58.0,
          product: 'Pesticide & Fertilizer Sacks',
          productCategory: 'Agro Chemical',
          totalLoadTons: '15-18 ton',
          totalLoadNumber: 16.0,
          truckTypeId: openType?.id,
          requiredTruckCategory: 'Open',
          requiredTruckTypeDesc: 'Open High Bed',
          requiredWheels: '10 Wheeler',
          requiredMinLengthFt: 24,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 9500.0,
          isRateNegotiable: true,
          pricingNote: 'Payment via cash or RTGS upon unloader signature',
          transporterName: 'AMIT ROY',
          transporterCompany: 'BIHAR BENGAL CARRIERS',
          transporterPhone: '+91 98350 11234',
          transporterRating: 4.2,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
        },
        {
          loadNumber: 'LD-9283',
          pickupCity: 'Patna',
          pickupState: 'Bihar',
          pickupAddress: 'Transport Nagar, Kumhrar, Patna',
          unloadingCity: 'Muzaffarpur',
          unloadingState: 'Bihar',
          unloadingAddress: 'Bela Industrial Area, Muzaffarpur',
          addressNote: 'Driver to call manager 1 hour prior to arrival',
          distanceKm: 85.0,
          product: 'TMT 40ft Long Iron Rods (Fe 550D)',
          productCategory: 'Iron & Steel',
          productLengthFt: 40.0, // Long length requirement!
          totalLoadTons: '35-40 ton',
          totalLoadNumber: 38.0,
          truckTypeId: trailerType?.id,
          requiredTruckCategory: 'Trailer',
          requiredTruckTypeDesc: '40ft Flatbed Trailer (Long Steel Passing)',
          requiredWheels: '18 Wheeler',
          requiredMinLengthFt: 40,
          paymentTerms: PaymentTerms.ADVANCE_BALANCE,
          ratePerTruck: 26000.0,
          isRateNegotiable: true,
          pricingNote: '₹10,000 Advance at loading point + balance on unloading',
          transporterName: 'MANISH SHARMA',
          transporterCompany: 'JINDAL LOGISTICS FREIGHT CORP',
          transporterPhone: '+91 99340 77112',
          transporterRating: 4.8,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
          instructions: 'Mandatory red flags on overhang; verified strapping required.',
        },
        {
          loadNumber: 'LD-9284',
          pickupCity: 'Danapur',
          pickupState: 'Bihar',
          pickupAddress: 'Danapur Cantt Logistics Rail Siding',
          unloadingCity: 'Hajipur',
          unloadingState: 'Bihar',
          unloadingAddress: 'Hajipur Industrial Area, Phase 2',
          addressNote: 'Address will be shared on call',
          distanceKm: 32.0,
          product: 'FMCG Biscuits & Confectionery',
          productCategory: 'FMCG',
          totalLoadTons: '6-7 ton',
          totalLoadNumber: 6.5,
          truckTypeId: lcvType?.id,
          requiredTruckCategory: 'LCV',
          requiredTruckTypeDesc: '14ft / 17ft LCV Closed',
          requiredWheels: '6 Wheeler',
          requiredMinLengthFt: 14,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 5800.0,
          isRateNegotiable: false,
          pricingNote: 'Fixed transporter price, prompt unloading guaranteed',
          transporterName: 'SUDHIR KUMAR',
          transporterCompany: 'MAA TARA LOGISTICS',
          transporterPhone: '+91 97710 44556',
          transporterRating: 4.0,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
        },
      ];

      await this.loadRepo.save(initialLoads.map((l) => this.loadRepo.create(l)));
      this.logger.log('Seeded Indian Freight Logistics Truck Types and Loads successfully');
    } catch (err) {
      this.logger.error('Failed to seed logistics data:', err);
    }
  }
}
