import type { Manufacturer } from '@/entities/hr/organization/manufacturer';
import type {
  BaseOrganizationRepository,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from './base-organization-repository';

// Manufacturer-specific creation schema
export interface CreateManufacturerSchema extends CreateOrganizationSchema {
  productionCapacity?: number;
  leadTime?: number;
  certifications?: string[];
  qualityRating?: number;
  defectRate?: number;
  minimumOrderQuantity?: number;
  paymentTerms?: string;
  countryOfOrigin?: string;
  factoryLocation?: string;
  externalId?: string;
  notes?: string;
}

// Manufacturer-specific update schema
export interface UpdateManufacturerSchema extends UpdateOrganizationSchema {
  productionCapacity?: number | null;
  leadTime?: number | null;
  certifications?: string[];
  qualityRating?: number | null;
  defectRate?: number | null;
  minimumOrderQuantity?: number | null;
  paymentTerms?: string | null;
  countryOfOrigin?: string | null;
  factoryLocation?: string | null;
  externalId?: string | null;
  notes?: string | null;
}

export interface ManufacturersRepository
  extends BaseOrganizationRepository<Manufacturer> {
  create(data: CreateManufacturerSchema): Promise<Manufacturer>;
  update(data: UpdateManufacturerSchema): Promise<Manufacturer | null>;
  findBySequentialCode(code: number): Promise<Manufacturer | null>;
  findByCountry(country: string): Promise<Manufacturer[]>;
  findByCertification(certification: string): Promise<Manufacturer[]>;
  findByQualityRatingRange(min: number, max: number): Promise<Manufacturer[]>;
}
