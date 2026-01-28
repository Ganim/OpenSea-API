import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import type { Customer as PrismaCustomer } from '@prisma/generated/client.js';

export function mapCustomerPrismaToDomain(customerDb: PrismaCustomer) {
  return {
    id: new UniqueEntityID(customerDb.id),
    name: customerDb.name,
    type: CustomerType.create(customerDb.type),
    document: customerDb.document
      ? Document.create(customerDb.document)
      : undefined,
    email: customerDb.email ?? undefined,
    phone: customerDb.phone ?? undefined,
    address: customerDb.address ?? undefined,
    city: customerDb.city ?? undefined,
    state: customerDb.state ?? undefined,
    zipCode: customerDb.zipCode ?? undefined,
    country: customerDb.country ?? undefined,
    notes: customerDb.notes ?? undefined,
    isActive: customerDb.isActive,
    createdAt: customerDb.createdAt,
    updatedAt: customerDb.updatedAt,
    deletedAt: customerDb.deletedAt ?? undefined,
  };
}

export function customerPrismaToDomain(customerDb: PrismaCustomer): Customer {
  return Customer.create(
    mapCustomerPrismaToDomain(customerDb),
    new UniqueEntityID(customerDb.id),
  );
}
