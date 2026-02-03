import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Customer } from '@/entities/sales/customer';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';
import { Document } from '@/entities/sales/value-objects/document';
import { faker } from '@faker-js/faker';

interface MakeCustomerProps {
  tenantId?: UniqueEntityID;
  name?: string;
  type?: 'INDIVIDUAL' | 'BUSINESS';
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function makeCustomer(override: MakeCustomerProps = {}): Customer {
  const customer = Customer.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      name: override.name ?? faker.person.fullName(),
      type: CustomerType.create(override.type ?? 'INDIVIDUAL'),
      document: override.document
        ? Document.create(override.document)
        : undefined,
      email: override.email,
      phone: override.phone,
      address: override.address,
      city: override.city,
      state: override.state,
      zipCode: override.zipCode,
      country: override.country,
      notes: override.notes,
      isActive: override.isActive ?? true,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt,
      deletedAt: override.deletedAt,
    },
    new UniqueEntityID(),
  );

  return customer;
}
