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
import { LogisticsProvider } from './entities/logistics-provider.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { TruckBodyType, LoadStatus, PaymentTerms, BidStatus } from './enums/logistics.enums';
import { CreateTruckTypeDto, UpdateTruckTypeDto } from './dto/truck-type.dto';
import { CreateLoadDto, UpdateLoadDto, CreateLoadBidDto } from './dto/load.dto';
import { QueryTruckTypesDto, QueryLoadsDto } from './dto/query-logistics.dto';
import {
  ApplyLogisticsProviderDto,
  ReviewLogisticsProviderDto,
  QueryLogisticsProvidersDto,
} from './dto/logistics-provider.dto';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum';
import { BusinessRole } from '../../common/enums/business-role.enum';

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
    @InjectRepository(LogisticsProvider)
    private readonly providerRepo: Repository<LogisticsProvider>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
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

    if (query.lengthFt) {
      qb.andWhere('l.requiredMinLengthFt = :lf', { lf: query.lengthFt });
    }

    if (query.truckTypeId) {
      qb.andWhere('l.truckTypeId = :ttid', { ttid: query.truckTypeId });
    }

    if (query.capacityRange && query.capacityRange !== 'ALL') {
      qb.andWhere(
        '(LOWER(l.totalLoadTons) LIKE :cr OR LOWER(l.requiredTruckTypeDesc) LIKE :cr)',
        { cr: `%${query.capacityRange.toLowerCase()}%` },
      );
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
      const containerType = savedTruckTypes.find((t) => t.category === 'Container');
      const trailerType = savedTruckTypes.find((t) => t.category === 'Trailer');
      const tankerType = savedTruckTypes.find((t) => t.category === 'Tanker');
      const tipperType = savedTruckTypes.find((t) => t.category === 'Tipper');
      const miniType = savedTruckTypes.find((t) => t.category === 'Mini/Pickup');
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
          requiredTruckTypeDesc: '28ft Open Body (14 Wheeler)',
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
          requiredTruckTypeDesc: '22ft Open High Bed (10 Wheeler)',
          requiredWheels: '10 Wheeler',
          requiredMinLengthFt: 22,
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
          loadNumber: 'LD-9285',
          pickupCity: 'Patna',
          pickupState: 'Bihar',
          pickupAddress: 'Didarganj Toll Plaza Logistics Hub',
          unloadingCity: 'Gaya',
          unloadingState: 'Bihar',
          unloadingAddress: 'Bodh Gaya Industrial Feeder Centre',
          addressNote: 'Toll will be reimbursed with original receipts',
          distanceKm: 110.0,
          product: 'Steel Angles & Channels (18ft)',
          productCategory: 'Iron & Steel',
          productLengthFt: 18.0,
          totalLoadTons: '8-10 ton',
          totalLoadNumber: 9.0,
          truckTypeId: openType?.id,
          requiredTruckCategory: 'Open',
          requiredTruckTypeDesc: '19ft Open Body (6 Wheeler)',
          requiredWheels: '6 Wheeler',
          requiredMinLengthFt: 19,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 13500.0,
          isRateNegotiable: true,
          pricingNote: 'Prompt clearance and driver tea allowance included',
          transporterName: 'VIKRAM SINGH',
          transporterCompany: 'MAGADH EXPRESS FREIGHT',
          transporterPhone: '+91 94312 33445',
          transporterRating: 4.5,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
        },
        {
          loadNumber: 'LD-9288',
          pickupCity: 'Patna',
          pickupState: 'Bihar',
          pickupAddress: 'Pataliputra Industrial Estate',
          unloadingCity: 'Kolkata',
          unloadingState: 'West Bengal',
          unloadingAddress: 'Dankuni Logistics Park, WB',
          addressNote: 'Custom seal provided at pickup point',
          distanceKm: 580.0,
          product: 'Branded Consumer Electronics & LED TVs',
          productCategory: 'Electronics',
          productLengthFt: 0,
          totalLoadTons: '7-9 ton',
          totalLoadNumber: 8.0,
          truckTypeId: containerType?.id,
          requiredTruckCategory: 'Container',
          requiredTruckTypeDesc: '19ft Closed Container (6 Wheeler)',
          requiredWheels: '6 Wheeler',
          requiredMinLengthFt: 19,
          paymentTerms: PaymentTerms.ADVANCE_BALANCE,
          ratePerTruck: 34000.0,
          isRateNegotiable: true,
          pricingNote: 'GPS tracking mandatory during transit',
          transporterName: 'SANJAY CHOUDHARY',
          transporterCompany: 'EAST INDIA CARGO EXPRESS',
          transporterPhone: '+91 99341 55667',
          transporterRating: 4.9,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
        },
        {
          loadNumber: 'LD-9289',
          pickupCity: 'Danapur',
          pickupState: 'Bihar',
          pickupAddress: 'Danapur Rail Freight Siding',
          unloadingCity: 'Siliguri',
          unloadingState: 'West Bengal',
          unloadingAddress: 'Fulbari Inland Container Depot',
          addressNote: 'Sealed box container only',
          distanceKm: 460.0,
          product: 'E-commerce FMCG & Packaged Snacks',
          productCategory: 'FMCG',
          productLengthFt: 0,
          totalLoadTons: '7.5-9 ton',
          totalLoadNumber: 8.5,
          truckTypeId: containerType?.id,
          requiredTruckCategory: 'Container',
          requiredTruckTypeDesc: '32ft SXL Container (Single Axle)',
          requiredWheels: '6 Wheeler',
          requiredMinLengthFt: 32,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 42000.0,
          isRateNegotiable: true,
          pricingNote: 'Volumetric cargo, lightweight but high cube capacity',
          transporterName: 'ALOK RANJAN',
          transporterCompany: 'QUICKFREIGHT LOGISTICS',
          transporterPhone: '+91 94314 66778',
          transporterRating: 4.7,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
        },
        {
          loadNumber: 'LD-9292',
          pickupCity: 'Barauni',
          pickupState: 'Bihar',
          pickupAddress: 'IOCL Barauni Refinery Terminal Gate 4',
          unloadingCity: 'Patna',
          unloadingState: 'Bihar',
          unloadingAddress: 'Indian Oil Depot, Sipara Patna',
          addressNote: 'PESO explosive license and spark arrestor mandatory',
          distanceKm: 125.0,
          product: 'Refined Kerosene / Light Diesel Oil',
          productCategory: 'Petroleum',
          productLengthFt: 0,
          totalLoadTons: '12-15 ton',
          totalLoadNumber: 14.0,
          truckTypeId: tankerType?.id,
          requiredTruckCategory: 'Tanker',
          requiredTruckTypeDesc: '12-15 Ton Tanker (16-18 KL • 10W)',
          requiredWheels: '10 Wheeler',
          requiredMinLengthFt: 24,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 17500.0,
          isRateNegotiable: false,
          pricingNote: 'Fixed oil company tariff, unloader signature payment',
          transporterName: 'RAJESHWAR TIWARY',
          transporterCompany: 'BIHAR REFINERY FLEET',
          transporterPhone: '+91 94318 44112',
          transporterRating: 4.6,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
        },
        {
          loadNumber: 'LD-9294',
          pickupCity: 'Patna',
          pickupState: 'Bihar',
          pickupAddress: 'Sudha Dairy Plant, Phulwarisharif',
          unloadingCity: 'Muzaffarpur',
          unloadingState: 'Bihar',
          unloadingAddress: 'Timul Chilling Plant, Muzaffarpur',
          addressNote: 'Food grade stainless steel SS304 barrel required',
          distanceKm: 78.0,
          product: 'Raw Pasteurized Milk (Chilled)',
          productCategory: 'Dairy Products',
          productLengthFt: 0,
          totalLoadTons: '8-11 ton',
          totalLoadNumber: 10.0,
          truckTypeId: tankerType?.id,
          requiredTruckCategory: 'Tanker',
          requiredTruckTypeDesc: '8-11 Ton Tanker (10-14 KL • 6W)',
          requiredWheels: '6 Wheeler',
          requiredMinLengthFt: 20,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 11500.0,
          isRateNegotiable: false,
          pricingNote: 'Immediate pump unloading within 45 mins',
          transporterName: 'ANIL KUMAR SINHA',
          transporterCompany: 'DAIRY CARRIERS UNION',
          transporterPhone: '+91 97712 33441',
          transporterRating: 4.9,
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
          loadNumber: 'LD-9295',
          pickupCity: 'Sonbhadra',
          pickupState: 'Uttar Pradesh',
          pickupAddress: 'Sone River Sand Ghat, Chopan',
          unloadingCity: 'Patna',
          unloadingState: 'Bihar',
          unloadingAddress: 'Digha AIIMS Flyover Construction Yard',
          addressNote: 'M-Chalan and GPS pass mandatory at Sonbhadra border',
          distanceKm: 240.0,
          product: 'Red River Sand (Sone Balu)',
          productCategory: 'Construction Aggregate',
          totalLoadTons: '16-20 ton',
          totalLoadNumber: 18.0,
          truckTypeId: tipperType?.id,
          requiredTruckCategory: 'Tipper',
          requiredTruckTypeDesc: '16-20 Ton Hydraulic Tipper (10 Wheeler)',
          requiredWheels: '10 Wheeler',
          requiredMinLengthFt: 22,
          paymentTerms: PaymentTerms.TO_PAY,
          ratePerTruck: 18500.0,
          isRateNegotiable: true,
          pricingNote: 'Quick mechanical tip unloading under 15 mins',
          transporterName: 'VIJAY PRATAP SINGH',
          transporterCompany: 'SONE VALLEY CARRIERS',
          transporterPhone: '+91 94319 88776',
          transporterRating: 4.3,
          isTransporterVerified: true,
          status: LoadStatus.OPEN,
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

      const providerCount = await this.providerRepo.count();
      if (providerCount === 0) {
        let sampleUser = await this.userRepo.findOne({ where: { phone: '+91 98765 43210' } });
        if (!sampleUser) {
          sampleUser = await this.userRepo.findOne({ where: { email: 'admin@cabbooking.com' } });
        }
        if (!sampleUser) {
          sampleUser = this.userRepo.create({
            name: 'Test Transporter',
            phone: '+91 98765 43210',
            email: 'transporter@testfreight.com',
            city: 'Patna',
            status: 'ACTIVE',
            isActive: true,
          });
          sampleUser = await this.userRepo.save(sampleUser);
        }

        const initialProvider = this.providerRepo.create({
          userId: sampleUser.id,
          businessName: 'test Freight Lines',
          contactPerson: 'test',
          phone: sampleUser.phone || '+91 98765 43210',
          email: sampleUser.email || 'transporter@testfreight.com',
          operatingCity: 'Patna',
          operatingHub: 'Transport Nagar, Kumhrar, Patna',
          businessType: 'Transporter / Fleet Broker',
          primaryCargoTypes: ['Agro / Grains', 'Iron & Steel', 'FMCG'],
          requiredVehicleCategories: ['Open', 'Container', 'Trailer'],
          gstin: '123123123',
          pan: 'AAACR4829K',
          isGstVerified: true,
          isAadhaarVerified: true,
          idProofUploaded: true,
          businessProofUploaded: true,
          accountHolder: 'test Freight Lines',
          bankName: 'State Bank of India',
          accountNumber: '382910482910',
          ifscCode: 'SBIN0001234',
          upiId: 'freight@upi',
          verificationStatus: VerificationStatus.PENDING,
        });

        await this.providerRepo.save(initialProvider);
        this.logger.log('Seeded initial pending logistics provider: test Freight Lines');
      }
    } catch (err) {
      this.logger.error('Failed to seed logistics data:', err);
    }
  }

  // =========================================================================
  // LOGISTICS PROVIDERS ONBOARDING & VERIFICATION (ADMIN & MOBILE)
  // =========================================================================

  async applyProvider(userId: string | undefined, dto: ApplyLogisticsProviderDto): Promise<LogisticsProvider> {
    const resolvedGstin = dto.gstin || dto.gstinNumber || null;
    const resolvedPan = dto.pan || dto.panNumber || null;

    // 1. Resolve or auto-provision real database User to prevent foreign key errors
    let targetUser: User | null = null;
    if (userId) {
      targetUser = await this.userRepo.findOne({ where: { id: userId } });
    }
    if (!targetUser && dto.userId) {
      targetUser = await this.userRepo.findOne({ where: { id: dto.userId } });
    }
    if (!targetUser && dto.phone) {
      targetUser = await this.userRepo.findOne({ where: { phone: dto.phone } });
    }
    if (!targetUser && dto.email) {
      targetUser = await this.userRepo.findOne({ where: { email: dto.email } });
    }

    if (!targetUser) {
      // Auto-create a user profile for this partner applicant
      const partnerRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.PARTNER },
      });

      targetUser = this.userRepo.create({
        name: dto.contactPerson || dto.businessName || 'Transporter Partner',
        phone: dto.phone || undefined,
        email: dto.email || `logistics_${Date.now()}@platform.local`,
        city: dto.operatingCity || 'Patna',
        status: 'ACTIVE',
        isActive: true,
      });
      targetUser = await this.userRepo.save(targetUser);

      if (partnerRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: targetUser.id,
            roleId: partnerRole.id,
            status: RoleAssignmentStatus.ACTIVE,
          }),
        );
      }
    }

    const effectiveUserId = targetUser.id;

    // 2. Check for existing logistics provider application
    let provider = await this.providerRepo.findOne({
      where: { userId: effectiveUserId },
      relations: { user: true },
    });

    if (provider) {
      provider.businessName = dto.businessName;
      provider.contactPerson = dto.contactPerson;
      provider.phone = dto.phone;
      provider.email = dto.email || provider.email;
      provider.operatingCity = dto.operatingCity;
      provider.operatingHub = dto.operatingHub;
      provider.businessType = dto.businessType || provider.businessType;
      if (dto.primaryCargoTypes) provider.primaryCargoTypes = dto.primaryCargoTypes;
      if (dto.requiredVehicleCategories) provider.requiredVehicleCategories = dto.requiredVehicleCategories;
      provider.gstin = resolvedGstin || provider.gstin;
      provider.pan = resolvedPan || provider.pan;
      provider.isGstVerified = dto.isGstVerified ?? provider.isGstVerified;
      provider.isAadhaarVerified = dto.isAadhaarVerified ?? provider.isAadhaarVerified;
      provider.idProofUploaded = dto.idProofUploaded ?? provider.idProofUploaded;
      provider.businessProofUploaded = dto.businessProofUploaded ?? provider.businessProofUploaded;
      provider.accountHolder = dto.accountHolder || provider.accountHolder;
      provider.bankName = dto.bankName || provider.bankName;
      provider.accountNumber = dto.accountNumber || provider.accountNumber;
      provider.ifscCode = dto.ifscCode || provider.ifscCode;
      provider.upiId = dto.upiId || provider.upiId;
      provider.verificationStatus = VerificationStatus.PENDING;
      provider.rejectionReason = null;
      return this.providerRepo.save(provider);
    }

    provider = this.providerRepo.create({
      userId: effectiveUserId,
      businessName: dto.businessName,
      contactPerson: dto.contactPerson,
      phone: dto.phone,
      email: dto.email || null,
      operatingCity: dto.operatingCity,
      operatingHub: dto.operatingHub,
      businessType: dto.businessType || 'Transporter / Fleet Broker',
      primaryCargoTypes: dto.primaryCargoTypes || ['Agro / Grains', 'Iron & Steel', 'FMCG'],
      requiredVehicleCategories: dto.requiredVehicleCategories || ['Open', 'Container', 'Trailer'],
      gstin: resolvedGstin,
      pan: resolvedPan,
      isGstVerified: dto.isGstVerified || false,
      isAadhaarVerified: dto.isAadhaarVerified || false,
      idProofUploaded: dto.idProofUploaded || false,
      businessProofUploaded: dto.businessProofUploaded || false,
      accountHolder: dto.accountHolder || null,
      bankName: dto.bankName || null,
      accountNumber: dto.accountNumber || null,
      ifscCode: dto.ifscCode || null,
      upiId: dto.upiId || null,
      verificationStatus: VerificationStatus.PENDING,
    });

    return this.providerRepo.save(provider);
  }

  async getMyProvider(userId?: string, phone?: string): Promise<LogisticsProvider | null> {
    if (userId) {
      const provider = await this.providerRepo.findOne({
        where: { userId },
        relations: { user: true },
      });
      if (provider) return provider;
    }

    if (phone) {
      const user = await this.userRepo.findOne({ where: { phone } });
      if (user) {
        return this.providerRepo.findOne({
          where: { userId: user.id },
          relations: { user: true },
        });
      }
    }

    return null;
  }

  async getProviders(query?: QueryLogisticsProvidersDto): Promise<LogisticsProvider[]> {
    const qb = this.providerRepo.createQueryBuilder('lp')
      .leftJoinAndSelect('lp.user', 'u');

    if (query?.search) {
      const term = `%${query.search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(lp.businessName) LIKE :term OR LOWER(lp.contactPerson) LIKE :term OR LOWER(lp.phone) LIKE :term OR LOWER(COALESCE(lp.gstin, \'\')) LIKE :term OR LOWER(COALESCE(u.name, \'\')) LIKE :term)',
        { term },
      );
    }

    if (query?.verificationStatus) {
      qb.andWhere('lp.verificationStatus = :status', { status: query.verificationStatus });
    }

    if (query?.city && query.city !== 'ALL') {
      qb.andWhere('LOWER(lp.operatingCity) = LOWER(:city)', { city: query.city });
    }

    qb.orderBy('lp.createdAt', 'DESC');

    return qb.getMany();
  }

  async getProviderById(id: string): Promise<LogisticsProvider> {
    const provider = await this.providerRepo.findOne({
      where: { id },
      relations: { user: true },
    });
    if (!provider) {
      throw new NotFoundException(`Logistics provider with ID ${id} not found`);
    }
    return provider;
  }

  async verifyProvider(id: string, adminUserId?: string, notes?: string): Promise<LogisticsProvider> {
    const provider = await this.getProviderById(id);

    provider.verificationStatus = VerificationStatus.VERIFIED;
    provider.reviewedBy = adminUserId || null;
    provider.reviewedAt = new Date();
    provider.rejectionReason = null;
    if (notes) provider.notes = notes;

    const saved = await this.providerRepo.save(provider);

    try {
      const partnerRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.PARTNER },
      });
      if (partnerRole) {
        const existingRole = await this.userRoleRepo.findOne({
          where: { userId: provider.userId, roleId: partnerRole.id },
        });
        if (!existingRole) {
          const userRole = this.userRoleRepo.create({
            userId: provider.userId,
            roleId: partnerRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
            approvedBy: adminUserId || null,
          });
          await this.userRoleRepo.save(userRole);
        }
      }
    } catch (err) {
      this.logger.warn('Could not auto-assign PARTNER role:', err);
    }

    return saved;
  }

  async rejectProvider(id: string, adminUserId?: string, rejectionReason?: string): Promise<LogisticsProvider> {
    const provider = await this.getProviderById(id);

    provider.verificationStatus = VerificationStatus.REJECTED;
    provider.reviewedBy = adminUserId || null;
    provider.reviewedAt = new Date();
    provider.rejectionReason = rejectionReason || 'KYC or business documentation could not be verified by administrator';

    return this.providerRepo.save(provider);
  }
}
