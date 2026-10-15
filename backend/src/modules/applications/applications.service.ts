import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProfessionalApplication } from './entities/professional-application.entity';
import { UserRole } from '../users/entities/user-role.entity';
import { Role } from '../users/entities/role.entity';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity';
import { DriverProfile } from '../drivers/entities/driver-profile.entity';
import { Vehicle } from '../drivers/entities/vehicle.entity';
import { DriverVehicle } from '../drivers/entities/driver-vehicle.entity';
import { ParkingOperator } from '../parking/entities/parking-operator.entity';
import { ParkingLocation } from '../parking/entities/parking-location.entity';
import { ApplyTechnicianDto } from './dto/apply-technician.dto';
import { ApplyDriverDto } from './dto/apply-driver.dto';
import { ApplyParkingDto } from './dto/apply-parking.dto';
import { ReviewApplicationDto } from './dto/review-application.dto';
import { QueryApplicationsDto } from './dto/query-applications.dto';
import { PaginatedResult } from '../../common/dto/pagination.dto';
import { ProfessionalRole, BusinessRole } from '../../common/enums/business-role.enum';
import { ApplicationStatus } from '../../common/enums/application-status.enum';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum';
import { VerificationStatus } from '../../common/enums/verification-status.enum';
import { DriverVehicleAssignmentStatus, VehicleStatus } from '../../common/enums/vehicle-status.enum';
import { ParkingLocationStatus } from '../../common/enums/parking-status.enum';

@Injectable()
export class ApplicationsService {
  constructor(
    @InjectRepository(ProfessionalApplication)
    private readonly appRepo: Repository<ProfessionalApplication>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(TechnicianProfile)
    private readonly techProfileRepo: Repository<TechnicianProfile>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
    @InjectRepository(ParkingOperator)
    private readonly parkingOpRepo: Repository<ParkingOperator>,
    private readonly dataSource: DataSource,
  ) {}

  private async findActiveApplication(userId: string, role: ProfessionalRole) {
    return this.appRepo.findOne({
      where: [
        { userId, requestedRole: role, status: ApplicationStatus.PENDING },
        { userId, requestedRole: role, status: ApplicationStatus.UNDER_REVIEW },
      ],
    });
  }

  async applyTechnician(userId: string, dto: ApplyTechnicianDto): Promise<ProfessionalApplication> {
    const existing = await this.findActiveApplication(userId, ProfessionalRole.TECHNICIAN);

    return this.dataSource.transaction(async (manager) => {
      // 1. Create or update TechnicianProfile with PENDING verification
      let techProfile = await manager.findOne(TechnicianProfile, { where: { userId } });
      if (techProfile) {
        techProfile.workshopName = dto.workshopName || techProfile.workshopName;
        techProfile.specializations = dto.specializations;
        techProfile.experienceYears = dto.experienceYears;
        techProfile.tradeQualification = dto.tradeQualification || techProfile.tradeQualification;
        techProfile.bio = dto.bio || techProfile.bio;
        techProfile.toolsAvailable = dto.toolsAvailable || techProfile.toolsAvailable;
        techProfile.vehicleType = dto.vehicleType || techProfile.vehicleType;
        techProfile.baseArea = dto.baseArea || techProfile.baseArea;
        techProfile.serviceRadiusKm = dto.serviceRadiusKm || techProfile.serviceRadiusKm;
        techProfile.operatingShift = dto.operatingShift || techProfile.operatingShift;
        techProfile.idProofUploaded = dto.idProofUploaded ?? techProfile.idProofUploaded;
        techProfile.certificateUploaded = dto.certificateUploaded ?? techProfile.certificateUploaded;
        techProfile.policeClearanceAccepted = dto.policeClearanceAccepted ?? techProfile.policeClearanceAccepted;
        techProfile.accountHolder = dto.accountHolder || techProfile.accountHolder;
        techProfile.bankName = dto.bankName || techProfile.bankName;
        techProfile.accountNumber = dto.accountNumber || techProfile.accountNumber;
        techProfile.ifscCode = dto.ifscCode || techProfile.ifscCode;
        techProfile.upiId = dto.upiId || techProfile.upiId;
        techProfile.verificationStatus = VerificationStatus.PENDING;
      } else {
        techProfile = manager.create(TechnicianProfile, {
          userId,
          workshopName: dto.workshopName,
          specializations: dto.specializations,
          experienceYears: dto.experienceYears,
          tradeQualification: dto.tradeQualification,
          bio: dto.bio,
          toolsAvailable: dto.toolsAvailable || [],
          vehicleType: dto.vehicleType || 'Bike with Tool Mounts',
          baseArea: dto.baseArea || 'Patna Central',
          serviceRadiusKm: dto.serviceRadiusKm || 15.0,
          operatingShift: dto.operatingShift || '24x7 Emergency & Daytime',
          idProofUploaded: dto.idProofUploaded || false,
          certificateUploaded: dto.certificateUploaded || false,
          policeClearanceAccepted: dto.policeClearanceAccepted || false,
          accountHolder: dto.accountHolder,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          ifscCode: dto.ifscCode,
          upiId: dto.upiId,
          verificationStatus: VerificationStatus.PENDING,
        });
      }
      await manager.save(techProfile);

      // 2. Create or update application record
      if (existing) {
        existing.status = ApplicationStatus.PENDING;
        existing.submittedAt = new Date();
        return manager.save(existing);
      }

      const app = manager.create(ProfessionalApplication, {
        userId,
        requestedRole: ProfessionalRole.TECHNICIAN,
        status: ApplicationStatus.PENDING,
        submittedAt: new Date(),
      });
      return manager.save(app);
    });
  }

  async applyDriver(userId: string, dto: ApplyDriverDto): Promise<ProfessionalApplication> {
    const existing = await this.findActiveApplication(userId, ProfessionalRole.DRIVER);

    return this.dataSource.transaction(async (manager) => {
      // 1. Create or update DriverProfile
      let driverProfile = await manager.findOne(DriverProfile, { where: { userId } });
      if (driverProfile) {
        driverProfile.licenseNumber = dto.licenseNumber;
        driverProfile.licenseExpiry = dto.licenseExpiry || driverProfile.licenseExpiry;
        driverProfile.licenseType = dto.licenseType || driverProfile.licenseType;
        driverProfile.dlFrontUploaded = dto.dlFrontUploaded ?? driverProfile.dlFrontUploaded;
        driverProfile.dlBackUploaded = dto.dlBackUploaded ?? driverProfile.dlBackUploaded;
        driverProfile.languages = dto.languages || driverProfile.languages;
        driverProfile.aadhaarVerified = dto.aadhaarVerified ?? driverProfile.aadhaarVerified;
        driverProfile.policeDeclarationAccepted =
          dto.policeDeclarationAccepted ?? driverProfile.policeDeclarationAccepted;
        driverProfile.codeOfConductAccepted =
          dto.codeOfConductAccepted ?? driverProfile.codeOfConductAccepted;
        driverProfile.verificationStatus = VerificationStatus.PENDING;
      } else {
        driverProfile = manager.create(DriverProfile, {
          userId,
          licenseNumber: dto.licenseNumber,
          licenseExpiry: dto.licenseExpiry,
          licenseType: dto.licenseType || 'Commercial LMV Transport',
          dlFrontUploaded: dto.dlFrontUploaded || false,
          dlBackUploaded: dto.dlBackUploaded || false,
          languages: dto.languages || ['Hindi', 'English'],
          aadhaarVerified: dto.aadhaarVerified || false,
          policeDeclarationAccepted: dto.policeDeclarationAccepted || false,
          codeOfConductAccepted: dto.codeOfConductAccepted || false,
          verificationStatus: VerificationStatus.PENDING,
        });
      }
      const savedDriver = await manager.save(driverProfile);

      // 2. Register vehicle if provided
      if (dto.vehiclePlateNumber) {
        let vehicle = await manager.findOne(Vehicle, {
          where: { registrationNumber: dto.vehiclePlateNumber.toUpperCase() },
        });
        if (!vehicle) {
          vehicle = manager.create(Vehicle, {
            ownerUserId: userId,
            vehicleCategory: dto.vehicleCategory || 'Sedan Prime',
            make: dto.vehicleMakeModel?.split(' ')[0] || 'Maruti Suzuki',
            model: dto.vehicleMakeModel || 'Dzire',
            registrationNumber: dto.vehiclePlateNumber.toUpperCase(),
            manufacturingYear: dto.manufacturingYear || '2023',
            fuelType: dto.fuelType || 'CNG + Petrol',
            seatingCapacity: dto.seatingCapacity || 4,
            rcNumber: dto.rcNumber,
            insurancePolicyNumber: dto.insurancePolicyNumber,
            permitType: dto.permitType || 'All India Commercial Tourist Permit',
            rcPhotoUploaded: dto.rcPhotoUploaded || false,
            insuranceDocUploaded: dto.insuranceDocUploaded || false,
            status: VehicleStatus.ACTIVE,
          });
          vehicle = await manager.save(vehicle);
        }

        const existingLink = await manager.findOne(DriverVehicle, {
          where: { driverProfileId: savedDriver.id, vehicleId: vehicle.id },
        });
        if (!existingLink) {
          await manager.save(
            manager.create(DriverVehicle, {
              driverProfileId: savedDriver.id,
              vehicleId: vehicle.id,
              isPrimary: true,
              assignmentStatus: DriverVehicleAssignmentStatus.ASSIGNED,
            }),
          );
        }
      }

      // 3. Create or update application record
      if (existing) {
        existing.status = ApplicationStatus.PENDING;
        existing.submittedAt = new Date();
        return manager.save(existing);
      }

      const app = manager.create(ProfessionalApplication, {
        userId,
        requestedRole: ProfessionalRole.DRIVER,
        status: ApplicationStatus.PENDING,
        submittedAt: new Date(),
      });
      return manager.save(app);
    });
  }

  async applyParking(userId: string, dto: ApplyParkingDto): Promise<ProfessionalApplication> {
    const existing = await this.findActiveApplication(userId, ProfessionalRole.PARKING_OPERATOR);

    return this.dataSource.transaction(async (manager) => {
      // 1. Create or update ParkingOperator profile
      let operator = await manager.findOne(ParkingOperator, { where: { userId } });
      if (operator) {
        operator.businessType = dto.businessType || operator.businessType;
        operator.facilityName = dto.facilityName || operator.facilityName;
        operator.ownerName = dto.ownerName;
        operator.businessPhone = dto.businessPhone;
        operator.businessEmail = dto.businessEmail || operator.businessEmail;
        operator.gstin = dto.gstin || operator.gstin;
        operator.ownershipProofUploaded = dto.ownershipProofUploaded ?? operator.ownershipProofUploaded;
        operator.tradeLicenseUploaded = dto.tradeLicenseUploaded ?? operator.tradeLicenseUploaded;
        operator.facilityPhotosUploaded = dto.facilityPhotosUploaded ?? operator.facilityPhotosUploaded;
        operator.accountHolder = dto.accountHolder || operator.accountHolder;
        operator.bankName = dto.bankName || operator.bankName;
        operator.accountNumber = dto.accountNumber || operator.accountNumber;
        operator.ifscCode = dto.ifscCode || operator.ifscCode;
        operator.verificationStatus = VerificationStatus.PENDING;
      } else {
        operator = manager.create(ParkingOperator, {
          userId,
          businessType: dto.businessType || 'Commercial Operator',
          facilityName: dto.facilityName,
          ownerName: dto.ownerName,
          businessPhone: dto.businessPhone,
          businessEmail: dto.businessEmail,
          gstin: dto.gstin,
          ownershipProofUploaded: dto.ownershipProofUploaded || false,
          tradeLicenseUploaded: dto.tradeLicenseUploaded || false,
          facilityPhotosUploaded: dto.facilityPhotosUploaded || false,
          accountHolder: dto.accountHolder,
          bankName: dto.bankName,
          accountNumber: dto.accountNumber,
          ifscCode: dto.ifscCode,
          verificationStatus: VerificationStatus.PENDING,
        });
      }
      const savedOperator = await manager.save(operator);

      // 2. Create initial parking location
      const totalCapacity = (dto.carSlotsTotal || 45) + (dto.bikeSlotsTotal || 35);
      const location = manager.create(ParkingLocation, {
        operatorId: savedOperator.id,
        name: dto.facilityName || `${dto.ownerName} Facility`,
        address: dto.address,
        landmark: dto.landmark,
        latitude: dto.latitude ?? dto.landmarkLatitude ?? null,
        longitude: dto.longitude ?? dto.landmarkLongitude ?? null,
        city: dto.city,
        pincode: dto.pincode,
        facilityStructure: dto.facilityStructure || 'Covered Basement & Ground',
        capacity: totalCapacity,
        carSlotsTotal: dto.carSlotsTotal || 45,
        bikeSlotsTotal: dto.bikeSlotsTotal || 35,
        evChargingPoints: dto.evChargingPoints || 4,
        availableSpaces: totalCapacity,
        availableCarSlots: dto.carSlotsTotal || 45,
        availableBikeSlots: dto.bikeSlotsTotal || 35,
        isOpen24x7: dto.isOpen24x7 ?? true,
        operatingHours: dto.operatingHours || '24x7 Open (Mon - Sun)',
        operatingSchedule: dto.operatingSchedule ?? null,
        carHourlyRate: dto.carHourlyRate || 30.0,
        carDailyRate: dto.carDailyRate || 250.0,
        bikeHourlyRate: dto.bikeHourlyRate || 15.0,
        amenities: dto.amenities || [
          '24/7 Security Guard',
          'CCTV Surveillance',
          'Covered Shade',
          'Automated Barrier Gate',
        ],
        addonServices: dto.addonServices || [],
        status: ParkingLocationStatus.INACTIVE, // Unapproved until operator is verified
      });
      await manager.save(location);

      // 3. Create or update application record
      if (existing) {
        existing.status = ApplicationStatus.PENDING;
        existing.submittedAt = new Date();
        return manager.save(existing);
      }

      const app = manager.create(ProfessionalApplication, {
        userId,
        requestedRole: ProfessionalRole.PARKING_OPERATOR,
        status: ApplicationStatus.PENDING,
        submittedAt: new Date(),
      });
      return manager.save(app);
    });
  }

  async findAll(query: QueryApplicationsDto): Promise<PaginatedResult<any>> {
    const qb = this.appRepo
      .createQueryBuilder('app')
      .leftJoinAndSelect('app.user', 'user');

    if (query.status) {
      qb.andWhere('app.status = :status', { status: query.status });
    }

    if (query.role) {
      qb.andWhere('app.requestedRole = :role', { role: query.role });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(user.name) LIKE LOWER(:search) OR LOWER(user.email) LIKE LOWER(:search) OR user.phone LIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    qb.orderBy('app.submittedAt', query.sortOrder || 'DESC');
    qb.skip(query.skip).take(query.limit);

    const [data, total] = await qb.getManyAndCount();

    // Enrich with profile information
    const enriched = await Promise.all(
      data.map(async (app) => {
        let profileDetails: any = null;
        if (app.requestedRole === ProfessionalRole.DRIVER) {
          profileDetails = await this.driverProfileRepo.findOne({
            where: { userId: app.userId },
            relations: { driverVehicles: { vehicle: true } },
          });
        } else if (app.requestedRole === ProfessionalRole.TECHNICIAN) {
          profileDetails = await this.techProfileRepo.findOne({
            where: { userId: app.userId },
          });
        } else if (app.requestedRole === ProfessionalRole.PARKING_OPERATOR) {
          profileDetails = await this.parkingOpRepo.findOne({
            where: { userId: app.userId },
            relations: { locations: true },
          });
        }
        return {
          ...app,
          profileDetails,
        };
      }),
    );

    return {
      data: enriched,
      meta: {
        total,
        page: query.page || 1,
        limit: query.limit || 10,
        totalPages: Math.ceil(total / (query.limit || 10)),
      },
    };
  }

  async findByUserId(userId: string): Promise<any[]> {
    const apps = await this.appRepo.find({
      where: { userId },
      order: { submittedAt: 'DESC' },
    });

    const [parkingOp, driverProfile, techProfile] = await Promise.all([
      this.parkingOpRepo.findOne({ where: { userId } }),
      this.driverProfileRepo.findOne({ where: { userId } }),
      this.techProfileRepo.findOne({ where: { userId } }),
    ]);

    const activeApps: any[] = [];
    for (const app of apps) {
      if (app.requestedRole === ProfessionalRole.TECHNICIAN && !techProfile) {
        // Technician profile was deleted, clean up orphaned application record
        await this.appRepo.delete({ id: app.id });
        continue;
      }
      if (app.requestedRole === ProfessionalRole.DRIVER && !driverProfile) {
        // Driver profile was deleted, clean up orphaned application record
        await this.appRepo.delete({ id: app.id });
        continue;
      }
      if (app.requestedRole === ProfessionalRole.PARKING_OPERATOR && !parkingOp) {
        // Parking operator was deleted, clean up orphaned application record
        await this.appRepo.delete({ id: app.id });
        continue;
      }

      let liveStatus: string = app.status;
      if (
        app.requestedRole === ProfessionalRole.PARKING_OPERATOR &&
        parkingOp?.verificationStatus === VerificationStatus.SUSPENDED
      ) {
        liveStatus = 'SUSPENDED';
      } else if (
        app.requestedRole === ProfessionalRole.DRIVER &&
        driverProfile?.verificationStatus === VerificationStatus.SUSPENDED
      ) {
        liveStatus = 'SUSPENDED';
      } else if (
        app.requestedRole === ProfessionalRole.TECHNICIAN &&
        techProfile?.verificationStatus === VerificationStatus.SUSPENDED
      ) {
        liveStatus = 'SUSPENDED';
      }

      activeApps.push({
        ...app,
        status: liveStatus,
      });
    }

    return activeApps;
  }

  async findById(id: string): Promise<any> {
    const app = await this.appRepo.findOne({
      where: { id },
      relations: {
        user: true,
      },
    });
    if (!app) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    let profileDetails: any = null;
    if (app.requestedRole === ProfessionalRole.DRIVER) {
      profileDetails = await this.driverProfileRepo.findOne({
        where: { userId: app.userId },
        relations: { driverVehicles: { vehicle: true } },
      });
    } else if (app.requestedRole === ProfessionalRole.TECHNICIAN) {
      profileDetails = await this.techProfileRepo.findOne({
        where: { userId: app.userId },
      });
    } else if (app.requestedRole === ProfessionalRole.PARKING_OPERATOR) {
      profileDetails = await this.parkingOpRepo.findOne({
        where: { userId: app.userId },
        relations: { locations: true },
      });
    }

    return {
      ...app,
      profileDetails,
    };
  }

  async review(id: string, dto: ReviewApplicationDto, adminId: string): Promise<ProfessionalApplication> {
    const app = await this.findById(id);

    if (app.status === ApplicationStatus.APPROVED) {
      throw new BadRequestException('Application has already been approved and cannot be modified');
    }

    if (dto.status === ApplicationStatus.REJECTED && !dto.rejectionReason) {
      throw new BadRequestException('A rejection reason is mandatory when rejecting an application');
    }

    return this.dataSource.transaction(async (manager) => {
      app.status = dto.status;
      app.reviewedAt = new Date();
      app.reviewedBy = adminId;
      app.rejectionReason = dto.rejectionReason || null;
      app.notes = dto.notes || app.notes;
      const savedApp = await manager.save(app);

      if (dto.status === ApplicationStatus.APPROVED) {
        // 1. Assign or activate role
        const role = await manager.findOne(Role, { where: { name: app.requestedRole } });
        if (role) {
          let userRole = await manager.findOne(UserRole, {
            where: { userId: app.userId, roleId: role.id },
          });
          if (userRole) {
            userRole.status = RoleAssignmentStatus.APPROVED;
            userRole.approvedAt = new Date();
            userRole.approvedBy = adminId;
            userRole.rejectedAt = null;
            userRole.rejectionReason = null;
            await manager.save(userRole);
          } else {
            await manager.save(
              manager.create(UserRole, {
                userId: app.userId,
                roleId: role.id,
                status: RoleAssignmentStatus.APPROVED,
                approvedAt: new Date(),
                approvedBy: adminId,
              }),
            );
          }
        }

        // 2. Activate corresponding profile
        if (app.requestedRole === ProfessionalRole.TECHNICIAN) {
          await manager.update(
            TechnicianProfile,
            { userId: app.userId },
            { verificationStatus: VerificationStatus.VERIFIED },
          );
        } else if (app.requestedRole === ProfessionalRole.DRIVER) {
          await manager.update(
            DriverProfile,
            { userId: app.userId },
            { verificationStatus: VerificationStatus.VERIFIED },
          );
        } else if (app.requestedRole === ProfessionalRole.PARKING_OPERATOR) {
          const operator = await manager.findOne(ParkingOperator, { where: { userId: app.userId } });
          if (operator) {
            operator.verificationStatus = VerificationStatus.VERIFIED;
            await manager.save(operator);
            // Activate operator locations
            await manager.update(
              ParkingLocation,
              { operatorId: operator.id },
              { status: ParkingLocationStatus.ACTIVE },
            );
          }
        }
      } else if (dto.status === ApplicationStatus.REJECTED) {
        // Set profile verification to REJECTED without affecting user customer account or existing roles
        if (app.requestedRole === ProfessionalRole.TECHNICIAN) {
          await manager.update(
            TechnicianProfile,
            { userId: app.userId },
            { verificationStatus: VerificationStatus.REJECTED },
          );
        } else if (app.requestedRole === ProfessionalRole.DRIVER) {
          await manager.update(
            DriverProfile,
            { userId: app.userId },
            { verificationStatus: VerificationStatus.REJECTED },
          );
        } else if (app.requestedRole === ProfessionalRole.PARKING_OPERATOR) {
          await manager.update(
            ParkingOperator,
            { userId: app.userId },
            { verificationStatus: VerificationStatus.REJECTED },
          );
        }
      }

      return savedApp;
    });
  }

  async cancel(id: string, userId: string): Promise<ProfessionalApplication> {
    const app = await this.findById(id);

    if (app.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own application');
    }

    if (app.status !== ApplicationStatus.PENDING && app.status !== ApplicationStatus.UNDER_REVIEW) {
      throw new BadRequestException(`Cannot cancel application in status ${app.status}`);
    }

    app.status = ApplicationStatus.CANCELLED;
    return this.appRepo.save(app);
  }
}
