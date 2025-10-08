import type { Customer } from '@/entities/sales/customer';

export interface CustomerDTO {
  id: string;
  name: string;
  type: string;
  document?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function customerToDTO(customer: Customer): CustomerDTO {
  return {
    id: customer.id.toString(),
    name: customer.name,
    type: customer.type.value,
    document: customer.document?.value,
    email: customer.email,
    phone: customer.phone,
    address: customer.address,
    city: customer.city,
    state: customer.state,
    zipCode: customer.zipCode,
    country: customer.country,
    notes: customer.notes,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    deletedAt: customer.deletedAt,
  };
}
