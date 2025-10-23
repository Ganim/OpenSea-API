import { prisma } from '@/lib/prisma';
import { makeCustomer } from './make-customer';

interface CreateCustomerProps {
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
}

export async function createCustomer(override: CreateCustomerProps = {}) {
  const customer = makeCustomer(override);

  await prisma.customer.create({
    data: {
      id: customer.id.toString(),
      name: customer.name,
      type: customer.type.value,
      document: customer.document?.value ?? null,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      address: customer.address ?? null,
      city: customer.city ?? null,
      state: customer.state ?? null,
      zipCode: customer.zipCode ?? null,
      country: customer.country ?? null,
      notes: customer.notes ?? null,
      isActive: customer.isActive,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt ?? customer.createdAt,
    },
  });

  return {
    customer,
    customerId: customer.id.toString(),
  };
}
