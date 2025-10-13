import type { Manufacturer } from '@/entities/stock/manufacturer';

export interface ManufacturerDTO {
  id: string;
  name: string;
  country: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  isActive: boolean;
  rating: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function manufacturerToDTO(manufacturer: Manufacturer): ManufacturerDTO {
  return {
    id: manufacturer.manufacturerId.toString(),
    name: manufacturer.name,
    country: manufacturer.country,
    email: manufacturer.email,
    phone: manufacturer.phone,
    website: manufacturer.website,
    addressLine1: manufacturer.addressLine1,
    addressLine2: manufacturer.addressLine2,
    city: manufacturer.city,
    state: manufacturer.state,
    postalCode: manufacturer.postalCode,
    isActive: manufacturer.isActive,
    rating: manufacturer.rating,
    notes: manufacturer.notes,
    createdAt: manufacturer.createdAt,
    updatedAt: manufacturer.updatedAt,
    deletedAt: manufacturer.deletedAt,
  };
}
