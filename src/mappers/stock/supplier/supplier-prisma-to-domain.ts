import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Supplier } from '@/entities/stock/supplier';
import { CNPJ } from '@/entities/stock/value-objects/cnpj';
import type { Supplier as PrismaSupplier } from '@prisma/client';

export function mapSupplierPrismaToDomain(supplierDb: PrismaSupplier) {
  return {
    id: new UniqueEntityID(supplierDb.id),
    name: supplierDb.name,
    sequentialCode: supplierDb.sequentialCode ?? undefined,
    cnpj: supplierDb.cnpj
      ? (CNPJ.create(supplierDb.cnpj) ?? undefined)
      : undefined,
    taxId: supplierDb.taxId ?? undefined,
    contact: supplierDb.contact ?? undefined,
    email: supplierDb.email ?? undefined,
    phone: supplierDb.phone ?? undefined,
    website: supplierDb.website ?? undefined,
    address: supplierDb.address ?? undefined,
    city: supplierDb.city ?? undefined,
    state: supplierDb.state ?? undefined,
    zipCode: supplierDb.zipCode ?? undefined,
    country: supplierDb.country ?? undefined,
    paymentTerms: supplierDb.paymentTerms ?? undefined,
    rating: supplierDb.rating
      ? Number(supplierDb.rating.toString())
      : undefined,
    isActive: supplierDb.isActive,
    notes: supplierDb.notes ?? undefined,
    createdAt: supplierDb.createdAt,
    updatedAt: supplierDb.updatedAt,
    deletedAt: supplierDb.deletedAt ?? undefined,
  };
}

export function supplierPrismaToDomain(supplierDb: PrismaSupplier): Supplier {
  return Supplier.create(
    mapSupplierPrismaToDomain(supplierDb),
    new UniqueEntityID(supplierDb.id),
  );
}
