import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Manufacturer } from '@/entities/stock/manufacturer';

export interface CreateManufacturerSchema {
  tenantId: string;
  code: string; // Código hierárquico auto-gerado (3 dígitos: 001)
  name: string;
  country: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
  rating?: number;
  notes?: string;
}

export interface UpdateManufacturerSchema {
  id: UniqueEntityID;
  name?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  isActive?: boolean;
  rating?: number;
  notes?: string;
}

export interface ManufacturersRepository {
  create(data: CreateManufacturerSchema): Promise<Manufacturer>;
  findById(id: UniqueEntityID, tenantId: string): Promise<Manufacturer | null>;
  findByName(name: string, tenantId: string): Promise<Manufacturer | null>;
  findMany(tenantId: string): Promise<Manufacturer[]>;
  findManyByCountry(country: string, tenantId: string): Promise<Manufacturer[]>;
  findManyByRating(
    minRating: number,
    tenantId: string,
  ): Promise<Manufacturer[]>;
  findManyActive(tenantId: string): Promise<Manufacturer[]>;
  update(data: UpdateManufacturerSchema): Promise<Manufacturer | null>;
  save(manufacturer: Manufacturer): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
  getNextSequentialCode(tenantId: string): Promise<number>;
}
