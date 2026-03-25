import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { GeofenceZone } from '@/entities/hr/geofence-zone';
import { prisma } from '@/lib/prisma';
import type {
  CreateGeofenceZoneData,
  GeofenceZonesRepository,
  UpdateGeofenceZoneData,
} from '../geofence-zones-repository';

function mapPrismaToDomain(data: {
  id: string;
  tenantId: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isActive: boolean;
  address: string | null;
  createdAt: Date;
  updatedAt: Date;
}): GeofenceZone {
  return GeofenceZone.create(
    {
      tenantId: data.tenantId,
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      radiusMeters: data.radiusMeters,
      isActive: data.isActive,
      address: data.address,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaGeofenceZonesRepository implements GeofenceZonesRepository {
  async create(data: CreateGeofenceZoneData): Promise<GeofenceZone> {
    const record = await prisma.geofenceZone.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        isActive: data.isActive ?? true,
        address: data.address ?? null,
      },
    });

    return mapPrismaToDomain(record);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<GeofenceZone | null> {
    const record = await prisma.geofenceZone.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!record) return null;

    return mapPrismaToDomain(record);
  }

  async findManyByTenantId(tenantId: string): Promise<GeofenceZone[]> {
    const records = await prisma.geofenceZone.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });

    return records.map(mapPrismaToDomain);
  }

  async findActiveByTenantId(tenantId: string): Promise<GeofenceZone[]> {
    const records = await prisma.geofenceZone.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return records.map(mapPrismaToDomain);
  }

  async update(
    id: UniqueEntityID,
    tenantId: string,
    data: UpdateGeofenceZoneData,
  ): Promise<GeofenceZone> {
    const record = await prisma.geofenceZone.update({
      where: { id: id.toString() },
      data,
    });

    return mapPrismaToDomain(record);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.geofenceZone.delete({
      where: { id: id.toString() },
    });
  }
}
