import type { Supplier } from '@/entities/hr/organization/supplier';
import type {
  BaseOrganizationRepository,
  CreateOrganizationSchema,
  UpdateOrganizationSchema,
} from './base-organization-repository';

// Supplier-specific creation schema
export interface CreateSupplierSchema extends CreateOrganizationSchema {
  paymentTerms?: string | null;
  rating?: number | null;
  isPreferredSupplier?: boolean;
  contractNumber?: string | null;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  leadTime?: number | null;
  minimumOrderValue?: number | null;
  externalId?: string | null;
  notes?: string | null;
}

// Supplier-specific update schema
export interface UpdateSupplierSchema extends UpdateOrganizationSchema {
  paymentTerms?: string | null;
  rating?: number | null;
  isPreferredSupplier?: boolean;
  contractNumber?: string | null;
  contractStartDate?: Date | null;
  contractEndDate?: Date | null;
  leadTime?: number | null;
  minimumOrderValue?: number | null;
  externalId?: string | null;
  notes?: string | null;
}

export interface SuppliersRepository
  extends BaseOrganizationRepository<Supplier> {
  create(data: CreateSupplierSchema): Promise<Supplier>;
  update(data: UpdateSupplierSchema): Promise<Supplier | null>;
  findBySequentialCode(code: number): Promise<Supplier | null>;
  findPreferredSuppliers(): Promise<Supplier[]>;
  findByRatingRange(min: number, max: number): Promise<Supplier[]>;
}
