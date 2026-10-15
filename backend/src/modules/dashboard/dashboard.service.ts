import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Booking } from '../bookings/entities/booking.entity.js';
import { Vehicle } from '../drivers/entities/vehicle.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity.js';
import { ParkingOperator } from '../parking/entities/parking-operator.entity.js';
import { User } from '../users/entities/user.entity.js';
import {
  BookingServiceType,
  BookingStatus,
  VerificationStatus,
  AvailabilityStatus,
  VehicleStatus,
} from '../../common/enums/index.js';
import {
  DashboardOverviewResponse,
  MetricItem,
  RevenueDataPoint,
  ServiceDistribution,
  FleetStatusBreakdown,
} from './dto/dashboard-overview.dto.js';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
    @InjectRepository(TechnicianProfile)
    private readonly technicianProfileRepo: Repository<TechnicianProfile>,
    @InjectRepository(ParkingOperator)
    private readonly parkingOperatorRepo: Repository<ParkingOperator>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getOverview(
    timeRange: 'today' | '7d' | '30d' = '7d',
  ): Promise<DashboardOverviewResponse> {
    try {
      // 1. Calculate time window
      const now = new Date();
      const startDate = new Date();
      let daysCount = 7;

      if (timeRange === 'today') {
        startDate.setHours(0, 0, 0, 0);
        daysCount = 1;
      } else if (timeRange === '30d') {
        startDate.setDate(now.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        daysCount = 30;
      } else {
        startDate.setDate(now.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        daysCount = 7;
      }

      // 2. Query TypeORM repositories in parallel with direct TypeORM type safety
      const [
        totalBookings,
        activeBookings,
        completedBookings,
        cancelledBookings,
        cabCount,
        parkingCount,
        techCount,
        revenueSumRaw,
        cabsList,
        driversList,
        techniciansList,
        parkingOperatorsList,
        totalUsers,
        recentBookingsRaw,
        rangeBookings,
      ] = await Promise.all([
        this.bookingRepo.count(),
        this.bookingRepo.count({
          where: [
            { status: BookingStatus.ACTIVE },
            { status: BookingStatus.UPCOMING },
          ],
        }),
        this.bookingRepo.count({ where: { status: BookingStatus.COMPLETED } }),
        this.bookingRepo.count({ where: { status: BookingStatus.CANCELLED } }),
        this.bookingRepo.count({ where: { serviceType: BookingServiceType.CAB } }),
        this.bookingRepo.count({ where: { serviceType: BookingServiceType.PARKING } }),
        this.bookingRepo.count({ where: { serviceType: BookingServiceType.TECHNICIAN } }),
        this.bookingRepo
          .createQueryBuilder('b')
          .select('COALESCE(SUM(b.total_amount), 0)', 'total')
          .where('b.status IN (:...statuses)', {
            statuses: [BookingStatus.COMPLETED, BookingStatus.ACTIVE],
          })
          .getRawOne<{ total: string }>(),
        this.vehicleRepo.find(),
        this.driverProfileRepo.find(),
        this.technicianProfileRepo.find(),
        this.parkingOperatorRepo.find(),
        this.userRepo.count(),
        this.bookingRepo.find({
          relations: { user: true, vehicle: true, driverProfile: true },
          order: { createdAt: 'DESC' },
          take: 10,
        }),
        this.bookingRepo.find({
          where: {
            createdAt: MoreThanOrEqual(startDate),
          },
          order: { createdAt: 'ASC' },
        }),
      ]);

      const totalRevenue = parseFloat(revenueSumRaw?.total || '0');

      // 3. Dynamic Cab Fleet stats
      const totalCabs = cabsList.length;
      const activeCabs = cabsList.filter(
        (c) => c.status === VehicleStatus.ACTIVE,
      ).length;

      // 4. Dynamic Driver stats
      const totalDrivers = driversList.length;
      const verifiedDrivers = driversList.filter(
        (d) => d.verificationStatus === VerificationStatus.VERIFIED,
      ).length;
      const onlineDrivers = driversList.filter(
        (d) => d.availabilityStatus === AvailabilityStatus.AVAILABLE,
      ).length;

      // 5. Dynamic Technician stats
      const totalTechnicians = techniciansList.length;
      const availableTechnicians = techniciansList.filter(
        (t) => t.availabilityStatus === AvailabilityStatus.AVAILABLE,
      ).length;
      const verifiedTechnicians = techniciansList.filter(
        (t) => t.verificationStatus === VerificationStatus.VERIFIED,
      ).length;

      // 6. Dynamic Parking stats
      const totalParkingFacilities = parkingOperatorsList.length;
      const verifiedParkingOperators = parkingOperatorsList.filter(
        (p) => p.verificationStatus === VerificationStatus.VERIFIED,
      ).length;

      // 7. Dynamic Service Distribution
      const totalServiceBookings = cabCount + parkingCount + techCount;

      const serviceDistribution: ServiceDistribution[] = [
        {
          name: 'Cab Rides',
          key: 'CAB',
          count: cabCount,
          percentage:
            totalServiceBookings > 0
              ? Math.round((cabCount / totalServiceBookings) * 100)
              : 0,
          color: '#6366f1',
        },
        {
          name: 'Smart Parking',
          key: 'PARKING',
          count: parkingCount,
          percentage:
            totalServiceBookings > 0
              ? Math.round((parkingCount / totalServiceBookings) * 100)
              : 0,
          color: '#10b981',
        },
        {
          name: 'Roadside Assistance',
          key: 'TECHNICIAN',
          count: techCount,
          percentage:
            totalServiceBookings > 0
              ? Math.round((techCount / totalServiceBookings) * 100)
              : 0,
          color: '#f59e0b',
        },
      ];

      // 8. Dynamic Fleet Category Breakdown
      const categoryMap = new Map<string, { total: number; available: number }>();
      cabsList.forEach((cab) => {
        const cat = cab.vehicleCategory || 'Standard';
        const curr = categoryMap.get(cat) || { total: 0, available: 0 };
        curr.total += 1;
        if (cab.status === VehicleStatus.ACTIVE) {
          curr.available += 1;
        }
        categoryMap.set(cat, curr);
      });

      const fleetBreakdown: FleetStatusBreakdown[] = Array.from(
        categoryMap.entries(),
      ).map(([category, val]) => ({
        category,
        count: val.total,
        available: val.available,
      }));

      // 9. Dynamic Revenue & Booking Trend aggregated by day
      const trendMap = new Map<
        string,
        {
          revenue: number;
          bookings: number;
          cabs: number;
          technicians: number;
          parking: number;
        }
      >();

      for (const b of rangeBookings) {
        const d = new Date(b.createdAt);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const key = `${yyyy}-${mm}-${dd}`;

        const current = trendMap.get(key) || {
          revenue: 0,
          bookings: 0,
          cabs: 0,
          technicians: 0,
          parking: 0,
        };

        current.revenue += Number(b.totalAmount || 0);
        current.bookings += 1;
        if (b.serviceType === BookingServiceType.CAB) current.cabs += 1;
        if (b.serviceType === BookingServiceType.TECHNICIAN) current.technicians += 1;
        if (b.serviceType === BookingServiceType.PARKING) current.parking += 1;

        trendMap.set(key, current);
      }

      const revenueTrend: RevenueDataPoint[] = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const dateKey = `${yyyy}-${mm}-${dd}`;
        const label = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const record = trendMap.get(dateKey);
        revenueTrend.push({
          date: label,
          revenue: record ? record.revenue : 0,
          bookings: record ? record.bookings : 0,
          cabs: record ? record.cabs : 0,
          technicians: record ? record.technicians : 0,
          parking: record ? record.parking : 0,
        });
      }

      // 10. Dynamic Headline Metrics derived purely from database
      const readyFleetPct =
        totalCabs > 0 ? Math.round((activeCabs / totalCabs) * 100) : 0;
      const totalPartners =
        onlineDrivers + availableTechnicians + verifiedParkingOperators;

      const metrics: MetricItem[] = [
        {
          title: 'Total Platform Revenue',
          value: `₹${totalRevenue.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
          description: `Cumulative gross bookings across all services`,
          iconName: 'IndianRupee',
          iconColor:
            'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400',
        },
        {
          title: 'Active Bookings & Jobs',
          value: activeBookings,
          description: `${completedBookings} completed • ${cancelledBookings} cancelled`,
          iconName: 'Car',
          iconColor:
            'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400',
        },
        {
          title: 'Active Fleet on Road',
          value: `${activeCabs} / ${totalCabs}`,
          description: `${readyFleetPct}% of registered cabs currently active`,
          iconName: 'ShieldCheck',
          iconColor:
            'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400',
        },
        {
          title: 'Available Partner Units',
          value: totalPartners,
          description: `${onlineDrivers} drivers • ${availableTechnicians} mechanics • ${verifiedParkingOperators} parking facilities`,
          iconName: 'Users',
          iconColor:
            'text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400',
        },
      ];

      return {
        summary: {
          totalRevenue,
          totalBookings,
          activeRides: activeBookings,
          completedRides: completedBookings,
          cancelledRides: cancelledBookings,
          totalCabs,
          activeCabs,
          totalDrivers,
          onlineDrivers,
          totalTechnicians,
          availableTechnicians,
          totalParkingFacilities,
          totalUsers,
        },
        metrics,
        revenueTrend,
        serviceDistribution,
        fleetBreakdown,
        partnerSummary: {
          drivers: {
            total: totalDrivers,
            online: onlineDrivers,
            verified: verifiedDrivers,
          },
          technicians: {
            total: totalTechnicians,
            available: availableTechnicians,
            verified: verifiedTechnicians,
          },
          parking: {
            total: totalParkingFacilities,
            verified: verifiedParkingOperators,
          },
        },
        recentBookings: recentBookingsRaw.map((b) => ({
          id: b.id,
          bookingNumber: b.bookingNumber || `BK-${b.id.slice(0, 8)}`,
          serviceType: b.serviceType,
          status: b.status,
          tripType: b.tripType,
          pickupLocation: b.pickupLocation,
          dropLocation: b.dropLocation || null,
          scheduledDateTime: b.scheduledDateTime || b.createdAt,
          totalAmount: Number(b.totalAmount || 0),
          passengerName: b.passengerName || b.user?.name || 'Customer',
          passengerPhone: b.passengerPhone || b.user?.phone || '—',
          cabName: b.cabName || b.vehicle?.name || null,
          cabPlateNumber:
            b.cabPlateNumber || b.vehicle?.registrationNumber || null,
          driverName: b.driverName || null,
          paymentStatus: b.paymentStatus,
          createdAt: b.createdAt,
        })),
      };
    } catch (error) {
      this.logger.error('Error computing dynamic dashboard overview', error);
      throw error;
    }
  }
}
