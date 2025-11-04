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
  const dto: CustomerDTO = {
    id: customer.id.toString(),
    name: customer.name,
    type: customer.type.value,
    isActive: customer.isActive,
    createdAt: customer.createdAt,
  };

  // Only include optional fields if they have a value
  if (customer.document?.value) dto.document = customer.document.value;
  if (customer.email) dto.email = customer.email;
  if (customer.phone) dto.phone = customer.phone;
  if (customer.address) dto.address = customer.address;
  if (customer.city) dto.city = customer.city;
  if (customer.state) dto.state = customer.state;
  if (customer.zipCode) dto.zipCode = customer.zipCode;
  if (customer.country) dto.country = customer.country;
  if (customer.notes) dto.notes = customer.notes;
  if (customer.updatedAt) dto.updatedAt = customer.updatedAt;
  if (customer.deletedAt) dto.deletedAt = customer.deletedAt;

  return dto;
}
