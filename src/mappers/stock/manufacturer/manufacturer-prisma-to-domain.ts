import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/stock/manufacturer';
import type { Manufacturer as PrismaManufacturer } from '@prisma/generated/client.js';

export function mapManufacturerPrismaToDomain(
  manufacturerDb: PrismaManufacturer,
) {
  return {
    id: new UniqueEntityID(manufacturerDb.id),
    tenantId: new UniqueEntityID(manufacturerDb.tenantId),
    code: manufacturerDb.code,
    name: manufacturerDb.name,
    country: manufacturerDb.country ?? '',
    email: manufacturerDb.email,
    phone: manufacturerDb.phone,
    website: manufacturerDb.website,
    addressLine1: manufacturerDb.address,
    addressLine2: null,
    city: manufacturerDb.city,
    state: manufacturerDb.state,
    postalCode: manufacturerDb.zipCode,
    isActive: manufacturerDb.isActive,
    rating: manufacturerDb.rating
      ? Number(manufacturerDb.rating.toString())
      : null,
    notes: manufacturerDb.notes,
    createdAt: manufacturerDb.createdAt,
    updatedAt: manufacturerDb.updatedAt,
    deletedAt: manufacturerDb.deletedAt ?? undefined,
  };
}

export function manufacturerPrismaToDomain(
  manufacturerDb: PrismaManufacturer,
): Manufacturer {
  return Manufacturer.create(
    mapManufacturerPrismaToDomain(manufacturerDb),
    new UniqueEntityID(manufacturerDb.id),
  );
}
