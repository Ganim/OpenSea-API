import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Supplier as PrismaSupplier } from '@prisma/generated/client.js';

/**
 * Maps a Prisma Supplier record to a plain domain-like object.
 * Note: There is no formal Supplier entity class yet — returns a POJO.
 */
export function supplierPrismaToDomain(supplierDb: PrismaSupplier) {
  return {
    id: new UniqueEntityID(supplierDb.id),
    tenantId: new UniqueEntityID(supplierDb.tenantId),
    name: supplierDb.name,
    cnpj: supplierDb.cnpj,
    taxId: supplierDb.taxId,
    contact: supplierDb.contact,
    email: supplierDb.email,
    phone: supplierDb.phone,
    website: supplierDb.website,
    address: supplierDb.address,
    city: supplierDb.city,
    state: supplierDb.state,
    zipCode: supplierDb.zipCode,
    country: supplierDb.country,
    paymentTerms: supplierDb.paymentTerms,
    rating: supplierDb.rating ? Number(supplierDb.rating.toString()) : null,
    isActive: supplierDb.isActive,
    notes: supplierDb.notes,
    createdAt: supplierDb.createdAt,
    updatedAt: supplierDb.updatedAt,
    deletedAt: supplierDb.deletedAt ?? undefined,
  };
}
