import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Location } from '@/entities/stock/location';
import { LocationType } from '@/entities/stock/value-objects/location-type';
import type { Location as PrismaLocation } from '@prisma/client';

export function mapLocationPrismaToDomain(locationDb: PrismaLocation) {
  return {
    id: new UniqueEntityID(locationDb.id),
    code: locationDb.code,
    titulo: locationDb.titulo,
    label: locationDb.label ?? undefined,
    type: LocationType.create(locationDb.type),
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
    totalChilds: locationDb.totalChilds,
  };
}

export function locationPrismaToDomain(locationDb: PrismaLocation): Location {
  return Location.create(
    mapLocationPrismaToDomain(locationDb),
    new UniqueEntityID(locationDb.id),
  );
}
