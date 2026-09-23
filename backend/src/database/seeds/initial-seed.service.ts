import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from '../../modules/users/entities/role.entity.js';
import { User } from '../../modules/users/entities/user.entity.js';
import { UserRole } from '../../modules/users/entities/user-role.entity.js';
import { Vehicle } from '../../modules/drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../../modules/drivers/entities/driver-profile.entity.js';
import { DriverVehicle } from '../../modules/drivers/entities/driver-vehicle.entity.js';
import { Booking } from '../../modules/bookings/entities/booking.entity.js';
import { BusinessRole } from '../../common/enums/business-role.enum.js';
import { RoleAssignmentStatus } from '../../common/enums/role-status.enum.js';
import { VerificationStatus } from '../../common/enums/verification-status.enum.js';
import { AvailabilityStatus } from '../../common/enums/availability-status.enum.js';
import { VehicleStatus, DriverVehicleAssignmentStatus } from '../../common/enums/vehicle-status.enum.js';
import {
  BookingServiceType,
  BookingStatus,
  BookingTripType,
  PaymentStatus,
} from '../../common/enums/index.js';

@Injectable()
export class InitialSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(InitialSeedService.name);

  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserRole)
    private readonly userRoleRepo: Repository<UserRole>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(DriverProfile)
    private readonly driverRepo: Repository<DriverProfile>,
    @InjectRepository(DriverVehicle)
    private readonly driverVehicleRepo: Repository<DriverVehicle>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async onApplicationBootstrap() {
    await this.seedRoles();
    await this.seedAdmin();
    await this.seedFleetAndBookings();
  }

  private async seedRoles() {
    const defaultRoles = [
      {
        name: BusinessRole.CUSTOMER,
        displayName: 'Customer',
        description: 'Default passenger and service customer account',
        permissions: ['trips:read', 'bookings:read', 'bookings:create'],
      },
      {
        name: BusinessRole.DRIVER,
        displayName: 'Professional Driver',
        description: 'Approved fleet and cab driver partner',
        permissions: ['trips:read', 'trips:update', 'drivers:read'],
      },
      {
        name: BusinessRole.TECHNICIAN,
        displayName: 'Automotive Technician',
        description: 'Verified roadside mechanic and technician partner',
        permissions: ['services:read', 'services:update'],
      },
      {
        name: BusinessRole.PARKING_OPERATOR,
        displayName: 'Parking Operator',
        description: 'Commercial parking facility operator',
        permissions: ['parking:read', 'parking:manage'],
      },
      {
        name: BusinessRole.ADMIN,
        displayName: 'Platform Administrator',
        description: 'Platform management and moderation access',
        permissions: ['users:read', 'users:manage', 'applications:manage'],
      },
      {
        name: BusinessRole.SUPER_ADMIN,
        displayName: 'Super Administrator',
        description: 'Full unrestricted system access',
        permissions: ['*'],
      },
      {
        name: BusinessRole.BUS_OPERATOR,
        displayName: 'Bus Operator Admin',
        description: 'Manages bus fleet, schedules, and drivers',
        permissions: ['buses:read', 'buses:create', 'trips:read'],
      },
      {
        name: BusinessRole.DISPATCHER,
        displayName: 'Live Dispatcher',
        description: 'Monitors real-time trips and route dispatches',
        permissions: ['trips:read', 'trips:update', 'routes:read'],
      },
      {
        name: BusinessRole.SUPPORT_AGENT,
        displayName: 'Customer Support Agent',
        description: 'Handles support requests and ticket queries',
        permissions: ['bookings:read', 'users:read'],
      },
    ];

    for (const r of defaultRoles) {
      const existing = await this.roleRepo.findOne({ where: { name: r.name } });
      if (!existing) {
        const role = this.roleRepo.create({
          name: r.name,
          displayName: r.displayName,
          description: r.description,
          permissions: r.permissions,
          isSystemRole: true,
        });
        await this.roleRepo.save(role);
        this.logger.log(`Seeded system role: ${r.name}`);
      }
    }
  }

  private async seedAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@cabbooking.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPassword123!';

    let admin = await this.userRepo.findOne({
      where: { email: adminEmail },
      relations: {
        userRoles: true,
      },
    });

    if (!admin) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      admin = this.userRepo.create({
        name: 'System Super Admin',
        email: adminEmail,
        phone: '+919999999999',
        passwordHash,
        isActive: true,
        status: 'ACTIVE',
        city: 'Patna',
      });
      admin = await this.userRepo.save(admin);
      this.logger.log(`Created default admin account: ${adminEmail}`);

      // Assign SUPER_ADMIN and ADMIN roles
      const superAdminRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.SUPER_ADMIN },
      });
      const adminRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.ADMIN },
      });

      if (superAdminRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: admin.id,
            roleId: superAdminRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }

      if (adminRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: admin.id,
            roleId: adminRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }
    }
  }

  private async seedFleetAndBookings() {
    // 1. Seed default customer user: rahul.kumar@gmail.com
    const customerEmail = 'rahul.kumar@gmail.com';
    const customerPhone = '+919876543210';
    let customer = await this.userRepo.findOne({
      where: [{ email: customerEmail }, { phone: customerPhone }],
    });
    if (!customer) {
      const passwordHash = await bcrypt.hash('UserPassword123!', 10);
      customer = this.userRepo.create({
        name: 'Rahul Kumar',
        email: customerEmail,
        phone: customerPhone,
        passwordHash,
        isActive: true,
        status: 'ACTIVE',
        city: 'Patna',
        walletBalance: 850.0,
      });
      customer = await this.userRepo.save(customer);

      const customerRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.CUSTOMER },
      });
      if (customerRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: customer.id,
            roleId: customerRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }
      this.logger.log(`Created default customer: ${customerEmail}`);
    }

    // 2. Seed default driver: ramesh.driver@cabbooking.com
    const driverEmail = 'ramesh.driver@cabbooking.com';
    const driverPhone = '+919835124789';
    let driverUser = await this.userRepo.findOne({
      where: [{ email: driverEmail }, { phone: driverPhone }],
    });
    if (!driverUser) {
      const passwordHash = await bcrypt.hash('DriverPassword123!', 10);
      driverUser = this.userRepo.create({
        name: 'Ramesh Kumar',
        email: driverEmail,
        phone: driverPhone,
        passwordHash,
        isActive: true,
        status: 'ACTIVE',
        city: 'Patna',
      });
      driverUser = await this.userRepo.save(driverUser);

      const driverRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.DRIVER },
      });
      if (driverRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: driverUser.id,
            roleId: driverRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }
    }

    let driverProfile = await this.driverRepo.findOne({
      where: { userId: driverUser.id },
    });
    if (!driverProfile) {
      const existingLicense = await this.driverRepo.findOne({
        where: { licenseNumber: 'BR0120220034921' },
      });
      if (!existingLicense) {
        driverProfile = this.driverRepo.create({
          userId: driverUser.id,
          licenseNumber: 'BR0120220034921',
          licenseType: 'Commercial LMV Transport',
          verificationStatus: VerificationStatus.VERIFIED,
          availabilityStatus: AvailabilityStatus.AVAILABLE,
          languages: ['Hindi', 'English', 'Bhojpuri'],
          aadhaarVerified: true,
          policeDeclarationAccepted: true,
          codeOfConductAccepted: true,
        });
        driverProfile = await this.driverRepo.save(driverProfile);
        this.logger.log(`Created verified driver profile for: ${driverUser.name}`);
      } else {
        driverProfile = existingLicense;
      }
    }

    // 3. Seed fleet vehicles
    const fleet = [
      {
        registrationNumber: 'BR 01 HB 3319',
        vehicleCategory: 'Hatchback',
        make: 'Maruti Suzuki',
        model: 'WagonR ZXI',
        color: 'Silky Silver',
        fuelType: 'CNG + Petrol',
        seatingCapacity: 4,
        luggageCapacity: 1,
        baseFare: 699.0,
        baseKm: 10.0,
        perKmCharge: 12.0,
        extraKmCharge: 15.0,
        roundoffCostPerKm: 11.0,
        outstationBaseCharge: 2299.0,
        outstationPerKmCharge: 13.5,
        originalFare: 839.0,
        badgeTag: 'FASTEST',
        rating: 4.8,
        reviewsCount: 412,
        etaMinutes: 6,
        imageUrl: 'assets/car.png',
        features: ['Compact & Fast', 'AC Included', 'Best City Commute', 'Instant Dispatch'],
        hasAc: true,
        tollIncluded: true,
        freeCancellation: true,
        isInstant: true,
        status: VehicleStatus.ACTIVE,
      },
      {
        registrationNumber: 'BR 01 EA 4521',
        vehicleCategory: 'Sedan',
        make: 'Maruti Suzuki',
        model: 'Dzire Prime',
        color: 'Pearl Arctic White',
        fuelType: 'CNG + Petrol',
        seatingCapacity: 4,
        luggageCapacity: 2,
        baseFare: 649.0,
        baseKm: 10.0,
        perKmCharge: 14.5,
        extraKmCharge: 17.0,
        roundoffCostPerKm: 13.0,
        outstationBaseCharge: 2499.0,
        outstationPerKmCharge: 15.0,
        originalFare: 799.0,
        badgeTag: 'BEST VALUE',
        rating: 4.88,
        reviewsCount: 1420,
        etaMinutes: 3,
        imageUrl: 'assets/car.png',
        features: ['AC Included', 'Clean Cab', 'Top Rated Driver', 'Toll Included'],
        hasAc: true,
        tollIncluded: true,
        freeCancellation: true,
        isInstant: true,
        status: VehicleStatus.ACTIVE,
      },
      {
        registrationNumber: 'BR 01 CX 8842',
        vehicleCategory: 'SUV / XL',
        make: 'Toyota',
        model: 'Innova Crysta 2.4 VX',
        color: 'Super White',
        fuelType: 'Diesel',
        seatingCapacity: 7,
        luggageCapacity: 4,
        baseFare: 1199.0,
        baseKm: 10.0,
        perKmCharge: 21.0,
        extraKmCharge: 24.0,
        roundoffCostPerKm: 19.0,
        outstationBaseCharge: 3999.0,
        outstationPerKmCharge: 22.0,
        originalFare: 1450.0,
        badgeTag: 'POPULAR',
        rating: 4.95,
        reviewsCount: 2310,
        etaMinutes: 5,
        imageUrl: 'assets/car-front.png',
        features: ['Dual AC', 'Extra Luggage Space', 'Captain Seats', 'Free Cancellation'],
        hasAc: true,
        tollIncluded: true,
        freeCancellation: true,
        isInstant: true,
        status: VehicleStatus.ACTIVE,
      },
      {
        registrationNumber: 'BR 01 EV 1092',
        vehicleCategory: 'Electric (EV)',
        make: 'Tata',
        model: 'Tiago EV XT',
        color: 'Teal Blue',
        fuelType: 'Electric (EV)',
        seatingCapacity: 4,
        luggageCapacity: 2,
        baseFare: 599.0,
        baseKm: 10.0,
        perKmCharge: 12.0,
        extraKmCharge: 14.0,
        roundoffCostPerKm: 11.0,
        outstationBaseCharge: 2199.0,
        outstationPerKmCharge: 13.0,
        originalFare: 720.0,
        badgeTag: 'ECO-FRIENDLY',
        rating: 4.82,
        reviewsCount: 890,
        etaMinutes: 4,
        imageUrl: 'assets/car-travelling.png',
        features: ['Silent Drive', 'AC Included', 'Eco-friendly', 'Fast Pickup'],
        hasAc: true,
        tollIncluded: true,
        freeCancellation: true,
        isInstant: true,
        status: VehicleStatus.ACTIVE,
      },
      {
        registrationNumber: 'BR 01 LX 9999',
        vehicleCategory: 'Luxury',
        make: 'Toyota',
        model: 'Camry Hybrid Executive',
        color: 'Attitude Black',
        fuelType: 'Hybrid',
        seatingCapacity: 4,
        luggageCapacity: 3,
        baseFare: 1899.0,
        baseKm: 10.0,
        perKmCharge: 28.0,
        extraKmCharge: 32.0,
        roundoffCostPerKm: 25.0,
        outstationBaseCharge: 5499.0,
        outstationPerKmCharge: 30.0,
        originalFare: 2250.0,
        badgeTag: 'LUXURY',
        rating: 4.98,
        reviewsCount: 530,
        etaMinutes: 8,
        imageUrl: 'assets/car-front1.png',
        features: ['Chauffeur in Uniform', 'Leather Seats', 'Bottled Water & Wi-Fi', 'Free Cancellation'],
        hasAc: true,
        tollIncluded: true,
        freeCancellation: true,
        isInstant: false,
        status: VehicleStatus.ACTIVE,
      },
    ];

    for (const v of fleet) {
      let vehicle = await this.vehicleRepo.findOne({
        where: { registrationNumber: v.registrationNumber },
      });
      if (!vehicle) {
        vehicle = this.vehicleRepo.create({
          ...v,
          ownerUserId: driverUser.id,
        });
        vehicle = await this.vehicleRepo.save(vehicle);
      } else {
        // Sync any updated pricing / card fields on restart
        Object.assign(vehicle, v);
        vehicle = await this.vehicleRepo.save(vehicle);
      }

      // Assign to driver
      const existingAssignment = await this.driverVehicleRepo.findOne({
        where: { driverProfileId: driverProfile.id, vehicleId: vehicle.id },
      });
      if (!existingAssignment) {
        await this.driverVehicleRepo.save(
          this.driverVehicleRepo.create({
            driverProfileId: driverProfile.id,
            vehicleId: vehicle.id,
            isPrimary: v.vehicleCategory === 'Sedan',
            assignmentStatus: DriverVehicleAssignmentStatus.ASSIGNED,
          }),
        );
      }
      this.logger.log(`Seeded fleet vehicle: ${v.make} ${v.model} (${v.registrationNumber})`);
    }

    // 3b. Seed Delhi fleet & driver for multi-location testing
    const delhiDriverEmail = 'vikram.driver@cabbooking.com';
    const delhiDriverPhone = '+919811099234';
    let delhiDriver = await this.userRepo.findOne({
      where: [{ email: delhiDriverEmail }, { phone: delhiDriverPhone }],
    });
    if (!delhiDriver) {
      const passwordHash = await bcrypt.hash('DriverPassword123!', 10);
      delhiDriver = this.userRepo.create({
        name: 'Vikram Singh',
        email: delhiDriverEmail,
        phone: delhiDriverPhone,
        passwordHash,
        isActive: true,
        status: 'ACTIVE',
        city: 'Delhi',
      });
      delhiDriver = await this.userRepo.save(delhiDriver);

      const driverRole = await this.roleRepo.findOne({
        where: { name: BusinessRole.DRIVER },
      });
      if (driverRole) {
        await this.userRoleRepo.save(
          this.userRoleRepo.create({
            userId: delhiDriver.id,
            roleId: driverRole.id,
            status: RoleAssignmentStatus.ACTIVE,
            approvedAt: new Date(),
          }),
        );
      }
    }

    let delhiDriverProfile = await this.driverRepo.findOne({
      where: { userId: delhiDriver.id },
    });
    if (!delhiDriverProfile) {
      const existingDl = await this.driverRepo.findOne({
        where: { licenseNumber: 'DL0420210088192' },
      });
      if (!existingDl) {
        delhiDriverProfile = this.driverRepo.create({
          userId: delhiDriver.id,
          licenseNumber: 'DL0420210088192',
          licenseType: 'Commercial LMV Transport',
          verificationStatus: VerificationStatus.VERIFIED,
          availabilityStatus: AvailabilityStatus.AVAILABLE,
          languages: ['Hindi', 'English', 'Punjabi'],
          aadhaarVerified: true,
          policeDeclarationAccepted: true,
          codeOfConductAccepted: true,
        });
        delhiDriverProfile = await this.driverRepo.save(delhiDriverProfile);
      } else {
        delhiDriverProfile = existingDl;
      }
    }

    const delhiFleet = [
      {
        registrationNumber: 'DL 01 AA 2024',
        vehicleCategory: 'Sedan',
        make: 'Hyundai',
        model: 'Aura CNG',
        color: 'Titan Grey',
        fuelType: 'CNG + Petrol',
        seatingCapacity: 4,
        status: VehicleStatus.ACTIVE,
      },
      {
        registrationNumber: 'DL 01 XY 7721',
        vehicleCategory: 'SUV / XL',
        make: 'Mahindra',
        model: 'XUV700 AX7',
        color: 'Midnight Black',
        fuelType: 'Diesel',
        seatingCapacity: 7,
        status: VehicleStatus.ACTIVE,
      },
      {
        registrationNumber: 'DL 01 EV 9901',
        vehicleCategory: 'Electric (EV)',
        make: 'MG',
        model: 'ZS EV Excite',
        color: 'Candy White',
        fuelType: 'Electric (EV)',
        seatingCapacity: 4,
        status: VehicleStatus.ACTIVE,
      },
    ];

    for (const v of delhiFleet) {
      let vehicle = await this.vehicleRepo.findOne({
        where: { registrationNumber: v.registrationNumber },
      });
      if (!vehicle) {
        vehicle = this.vehicleRepo.create({
          ...v,
          ownerUserId: delhiDriver.id,
        });
        vehicle = await this.vehicleRepo.save(vehicle);

        const existingAssignment = await this.driverVehicleRepo.findOne({
          where: { driverProfileId: delhiDriverProfile.id, vehicleId: vehicle.id },
        });
        if (!existingAssignment) {
          await this.driverVehicleRepo.save(
            this.driverVehicleRepo.create({
              driverProfileId: delhiDriverProfile.id,
              vehicleId: vehicle.id,
              isPrimary: v.vehicleCategory === 'Sedan',
              assignmentStatus: DriverVehicleAssignmentStatus.ASSIGNED,
            }),
          );
        }
        this.logger.log(`Seeded Delhi fleet vehicle: ${v.make} ${v.model} (${v.registrationNumber})`);
      }
    }

    // 4. Seed initial bookings for customer
    const existingBookingsCount = await this.bookingRepo.count({
      where: { userId: customer.id },
    });
    if (existingBookingsCount === 0) {
      const now = new Date();

      const initialBookings = [
        {
          bookingNumber: '#CAB-84920',
          userId: customer.id,
          serviceType: BookingServiceType.CAB,
          status: BookingStatus.ACTIVE,
          tripType: BookingTripType.ONE_WAY,
          pickupLocation: 'Jagdeopath, Patna, Bihar',
          dropLocation: 'Danapur Railway Station, Patna',
          intermediateStop: 'Bailey Road Crossing',
          scheduledDateTime: new Date(now.getTime() + 15 * 60000),
          baseFare: 1750,
          platformFee: 100,
          discountAmount: 0,
          totalAmount: 1850,
          paymentMethod: 'UPI (Google Pay)',
          paymentStatus: PaymentStatus.COMPLETED,
          passengerName: customer.name,
          passengerPhone: customer.phone,
          otp: '4829',
          cabName: 'Toyota Innova Crysta',
          cabCategory: 'Premier SUV',
          cabPlateNumber: 'BR 01 EA 4521',
          driverName: 'Ramesh Kumar',
          driverPhone: '+91 98351 24789',
          driverRating: 4.9,
          driverProfileId: driverProfile.id,
        },
        {
          bookingNumber: '#PRK-72910',
          userId: customer.id,
          serviceType: BookingServiceType.PARKING,
          status: BookingStatus.UPCOMING,
          tripType: BookingTripType.ONE_WAY,
          pickupLocation: 'City Center Mall • Smart Parking, Fraser Road, Patna',
          dropLocation: 'Bay P2-14 • Level B2 (Covered)',
          scheduledDateTime: new Date(now.getTime() + 2 * 3600000),
          baseFare: 210,
          platformFee: 50,
          discountAmount: 0,
          totalAmount: 260,
          paymentMethod: 'Fastag / Wallet',
          paymentStatus: PaymentStatus.COMPLETED,
          passengerName: customer.name,
          passengerPhone: customer.phone,
          otp: '7412',
          cabName: 'Patna City Center Smart Parking',
          cabCategory: 'Smart Parking Bay',
          cabPlateNumber: 'BR 01 CX 8842',
          driverName: 'Parking Operator Valet',
          driverPhone: '+91 98000 11223',
          driverRating: 4.8,
          metadata: {
            floor: 'Level B2 (Covered)',
            bay: 'P2-14',
            gatePin: '7412',
            qrPayload: 'PARK_ACCESS_PRK72910_BAY_P2_14',
            durationHours: 3,
          },
        },
        {
          bookingNumber: '#MEC-20914',
          userId: customer.id,
          serviceType: BookingServiceType.TECHNICIAN,
          status: BookingStatus.COMPLETED,
          tripType: BookingTripType.ONE_WAY,
          pickupLocation: 'AIIMS Road, Phulwari Sharif, Patna',
          dropLocation: 'Flat Tire Rapid Fix & Pressure Calibration',
          scheduledDateTime: new Date(now.getTime() - 8 * 86400000),
          baseFare: 249,
          platformFee: 0,
          discountAmount: 50,
          totalAmount: 199,
          paymentMethod: 'UPI (PhonePe)',
          paymentStatus: PaymentStatus.COMPLETED,
          passengerName: customer.name,
          passengerPhone: customer.phone,
          otp: '5512',
          cabName: 'Flat Tire Rapid Fix',
          cabCategory: 'Tire & Wheel Emergency',
          cabPlateNumber: 'BR 01 BX 9201',
          driverName: 'Md. Imran',
          driverPhone: '+91 97711 44556',
          driverRating: 5.0,
          metadata: {
            serviceTitle: 'Flat Tire Rapid Fix & Pressure Calibration',
            symptomTags: ['Front Left Puncture', 'Pressure Loss'],
          },
        },
      ];

      for (const b of initialBookings) {
        const existing = await this.bookingRepo.findOne({
          where: { bookingNumber: b.bookingNumber },
        });
        if (!existing) {
          await this.bookingRepo.save(this.bookingRepo.create(b));
        }
      }
      this.logger.log(`Seeded initial bookings for customer: ${customerEmail}`);
    }
  }
}
