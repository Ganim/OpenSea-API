import type { Supplier } from '@/entities/stock/supplier';

export interface SupplierDTO {
  id: string;
  name: string;
  cnpj?: string;
  taxId?: string;
  contact?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  paymentTerms?: string;
  rating?: number;
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function supplierToDTO(supplier: Supplier): SupplierDTO {
  return {
    id: supplier.id.toString(),
    name: supplier.name,
    cnpj: supplier.cnpj?.formatted,
    taxId: supplier.taxId,
    contact: supplier.contact,
    email: supplier.email,
    phone: supplier.phone,
    website: supplier.website,
    address: supplier.address,
    city: supplier.city,
    state: supplier.state,
    zipCode: supplier.zipCode,
    country: supplier.country,
    paymentTerms: supplier.paymentTerms,
    rating: supplier.rating,
    isActive: supplier.isActive,
    notes: supplier.notes,
    createdAt: supplier.createdAt,
    updatedAt: supplier.updatedAt,
    deletedAt: supplier.deletedAt,
  };
}
