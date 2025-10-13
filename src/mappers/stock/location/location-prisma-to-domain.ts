import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import type { Location as PrismaLocation } from '@prisma/client';

export function mapLocationPrismaToDomain(locationDb: PrismaLocation) {
  return {
    id: new UniqueEntityID(locationDb.id),
    code: locationDb.code,
    description: locationDb.description ?? undefined,
    locationType: locationDb.locationType
      ? LocationType.create(locationDb.locationType)
      : undefined,
    parentId: locationDb.parentId
      ? new UniqueEntityID(locationDb.parentId)
      : undefined,
    capacity: locationDb.capacity
      ? Number(locationDb.capacity.toString())
      : undefined,
    currentOccupancy: locationDb.currentOccupancy
      ? Number(locationDb.currentOccupancy.toString())
      : undefined,
    isActive: locationDb.isActive,
    createdAt: locationDb.createdAt,
    updatedAt: locationDb.updatedAt,
    deletedAt: locationDb.deletedAt ?? undefined,
  };
}

export function locationPrismaToDomain(locationDb: PrismaLocation): Location {
  return Location.create(
    mapLocationPrismaToDomain(locationDb),
    new UniqueEntityID(locationDb.id),
  );
}
