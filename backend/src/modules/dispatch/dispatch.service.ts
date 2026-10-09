import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { DriverProfile } from '../drivers/entities/driver-profile.entity.js';
import { TechnicianProfile } from '../technicians/entities/technician-profile.entity.js';
import { AvailabilityStatus } from '../../common/enums/availability-status.enum.js';
import { BookingServiceType } from '../../common/enums/booking-service-type.enum.js';

export interface ConnectedProvider {
  socketId: string;
  userId: string;
  role: string; // DRIVER, TECHNICIAN, etc.
  serviceCategory: string; // CAB, TECHNICIAN, PARKING
  lat: number | null;
  lng: number | null;
  address?: string;
  isOnline: boolean;
  connectedAt: Date;
}

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  // In-memory registry of active connected sockets
  private readonly connectedClients = new Map<string, ConnectedProvider>();

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(DriverProfile)
    private readonly driverProfileRepo: Repository<DriverProfile>,
    @InjectRepository(TechnicianProfile)
    private readonly technicianProfileRepo: Repository<TechnicianProfile>,
  ) {}

  /**
   * Register or update a connected socket client
   */
  async registerClient(
    socketId: string,
    data: {
      userId: string;
      role?: string;
      serviceCategory?: string;
      lat?: number;
      lng?: number;
      address?: string;
      isOnline?: boolean;
    },
  ): Promise<ConnectedProvider> {
    const role = (data.role || 'DRIVER').toUpperCase();
    const serviceCategory = (data.serviceCategory || 'CAB').toUpperCase();

    let isOnline = false;
    if (data.isOnline !== undefined) {
      isOnline = data.isOnline;
      const status = isOnline ? AvailabilityStatus.AVAILABLE : AvailabilityStatus.OFFLINE;
      try {
        if (role === 'DRIVER') {
          await this.driverProfileRepo.update({ userId: data.userId }, { availabilityStatus: status });
        } else if (role === 'TECHNICIAN') {
          await this.technicianProfileRepo.update({ userId: data.userId }, { availabilityStatus: status });
        }
      } catch (_) {}
    } else {
      try {
        if (role === 'DRIVER') {
          const driver = await this.driverProfileRepo.findOne({ where: { userId: data.userId } });
          isOnline = driver?.availabilityStatus === AvailabilityStatus.AVAILABLE;
        } else if (role === 'TECHNICIAN') {
          const tech = await this.technicianProfileRepo.findOne({ where: { userId: data.userId } });
          isOnline = tech?.availabilityStatus === AvailabilityStatus.AVAILABLE;
        }
      } catch (err: any) {
        this.logger.warn(`Could not read DB availability for user ${data.userId}: ${err?.message}`);
      }
    }

    const existing = this.connectedClients.get(socketId) || {
      socketId,
      userId: data.userId,
      role,
      serviceCategory,
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      address: data.address,
      isOnline,
      connectedAt: new Date(),
    };

    existing.userId = data.userId;
    existing.role = role;
    existing.serviceCategory = serviceCategory;
    existing.isOnline = isOnline;
    if (data.lat !== undefined) existing.lat = data.lat;
    if (data.lng !== undefined) existing.lng = data.lng;
    if (data.address !== undefined) existing.address = data.address;

    this.connectedClients.set(socketId, existing);
    this.logger.log(
      `Registered client socket ${socketId} for user ${data.userId} (Role: ${role}, Category: ${serviceCategory}, isOnline: ${isOnline})`,
    );

    // Also persist current coordinates if provided
    if (data.lat !== undefined && data.lng !== undefined) {
      this.persistLocation(data.userId, data.lat, data.lng, data.address).catch(
        (err) => this.logger.warn(`Failed to persist location on register: ${err}`),
      );
    }

    return existing;
  }

  /**
   * Remove client on socket disconnection and mark OFFLINE in DB
   */
  async unregisterClient(socketId: string) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      try {
        if (client.role === 'DRIVER') {
          await this.driverProfileRepo.update(
            { userId: client.userId },
            { availabilityStatus: AvailabilityStatus.OFFLINE },
          );
        } else if (client.role === 'TECHNICIAN') {
          await this.technicianProfileRepo.update(
            { userId: client.userId },
            { availabilityStatus: AvailabilityStatus.OFFLINE },
          );
        }
        this.logger.log(`Marked user ${client.userId} as OFFLINE in DB on socket disconnect`);
      } catch (err: any) {
        this.logger.warn(`Could not set OFFLINE on unregister for user ${client.userId}: ${err?.message}`);
      }
      this.connectedClients.delete(socketId);
    }
  }

  /**
   * Update location for a connected socket & DB
   */
  async updateLocation(
    socketId: string,
    userId: string,
    lat: number,
    lng: number,
    address?: string,
  ) {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.lat = lat;
      client.lng = lng;
      if (address) client.address = address;
    }

    await this.persistLocation(userId, lat, lng, address);
  }

  /**
   * Persist location in User and profile entities
   */
  async persistLocation(
    userId: string,
    lat: number,
    lng: number,
    address?: string,
  ) {
    const now = new Date();
    try {
      // 1. Update User
      await this.userRepo.update(
        { id: userId },
        {
          currentLat: lat,
          currentLng: lng,
          currentAddress: address || undefined,
          lastLocationUpdatedAt: now,
        },
      );

      // 2. Update DriverProfile if exists
      const driver = await this.driverProfileRepo.findOne({
        where: { userId },
      });
      if (driver) {
        await this.driverProfileRepo.update(
          { id: driver.id },
          {
            currentLat: lat,
            currentLng: lng,
            currentAddress: address || undefined,
            lastLocationUpdatedAt: now,
          },
        );
      }

      // 3. Update TechnicianProfile if exists
      const tech = await this.technicianProfileRepo.findOne({
        where: { userId },
      });
      if (tech) {
        await this.technicianProfileRepo.update(
          { id: tech.id },
          {
            currentLat: lat,
            currentLng: lng,
            currentAddress: address || undefined,
            lastLocationUpdatedAt: now,
          },
        );
      }
    } catch (err) {
      this.logger.error(`Error saving location for user ${userId}: ${(err as any)?.message}`);
    }
  }

  /**
   * Toggle provider online state and persist to database
   */
  async setProviderOnlineStatus(socketId: string, isOnline: boolean): Promise<ConnectedProvider | null> {
    const client = this.connectedClients.get(socketId);
    if (!client) return null;

    client.isOnline = isOnline;
    const status = isOnline ? AvailabilityStatus.AVAILABLE : AvailabilityStatus.OFFLINE;

    try {
      if (client.role === 'DRIVER') {
        await this.driverProfileRepo.update(
          { userId: client.userId },
          { availabilityStatus: status },
        );
        this.logger.log(`Persisted DriverProfile availabilityStatus=${status} for user ${client.userId}`);
      } else if (client.role === 'TECHNICIAN') {
        await this.technicianProfileRepo.update(
          { userId: client.userId },
          { availabilityStatus: status },
        );
        this.logger.log(`Persisted TechnicianProfile availabilityStatus=${status} for user ${client.userId}`);
      }
    } catch (err: any) {
      this.logger.error(`Error saving availabilityStatus for user ${client.userId}: ${err?.message}`);
    }

    return client;
  }

  /**
   * Find candidate socket IDs within 20km for a given service category
   */
  async findEligibleProvidersWithinRadius(
    serviceType: BookingServiceType | string,
    pickupLat?: number | null,
    pickupLng?: number | null,
    radiusKm = 20,
  ): Promise<string[]> {
    const categoryUpper = (serviceType || 'CAB').toString().toUpperCase();
    const candidateSocketIds: string[] = [];

    // Filter from connected in-memory clients first
    for (const client of this.connectedClients.values()) {
      if (!client.isOnline) continue;

      // Category matching: CAB matches CAB/DRIVER, TECHNICIAN matches TECHNICIAN
      const matchesCategory =
        client.serviceCategory === categoryUpper ||
        (categoryUpper === 'CAB' && client.role === 'DRIVER') ||
        (categoryUpper === 'TECHNICIAN' && client.role === 'TECHNICIAN');

      if (!matchesCategory) continue;

      // If coordinates are provided for both pickup and client, check distance <= 20km
      if (
        pickupLat !== undefined &&
        pickupLat !== null &&
        pickupLng !== undefined &&
        pickupLng !== null &&
        client.lat !== null &&
        client.lng !== null
      ) {
        const distance = this.calculateHaversineDistanceKm(
          pickupLat,
          pickupLng,
          client.lat,
          client.lng,
        );
        if (distance <= radiusKm) {
          candidateSocketIds.push(client.socketId);
        }
      } else {
        // Fallback: If no coordinates known yet, include available connected provider
        candidateSocketIds.push(client.socketId);
      }
    }

    this.logger.log(
      `Found ${candidateSocketIds.length} eligible connected providers for ${categoryUpper} within ${radiusKm}km radius`,
    );

    return candidateSocketIds;
  }

  /**
   * Haversine distance formula in kilometers
   */
  calculateHaversineDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }
}
