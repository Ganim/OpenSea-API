import type { Supplier } from '@/entities/hr/organization/supplier';
import type { TaxRegime } from '@/entities/hr/organization/organization';

export interface SupplierDTO {
  id: string;
  type: 'SUPPLIER';
  legalName: string;
  cnpj?: string | null;
  cpf?: string | null;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: TaxRegime | null;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';
  email?: string | null;
  phoneMain?: string | null;
  website?: string | null;

  // Supplier specific fields
  paymentTerms?: string | null;
  rating?: number | null;
  isPreferredSupplier: boolean;
  contractNumber?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  leadTime?: number | null;
  minimumOrderValue?: number | null;
  sequentialCode?: number;
  externalId?: string | null;
  notes?: string | null;

  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export function supplierToDTO(supplier: Supplier): SupplierDTO {
  return {
    id: supplier.id.toString(),
    type: 'SUPPLIER',
    legalName: supplier.legalName,
    cnpj: supplier.cnpj ?? null,
    cpf: supplier.cpf ?? null,
    tradeName: supplier.tradeName ?? null,
    stateRegistration: supplier.stateRegistration ?? null,
    municipalRegistration: supplier.municipalRegistration ?? null,
    taxRegime: supplier.taxRegime ?? null,
    status: supplier.status,
    email: supplier.email ?? null,
    phoneMain: supplier.phoneMain ?? null,
    website: supplier.website ?? null,

    // Supplier specific fields
    paymentTerms: supplier.paymentTerms ?? null,
    rating: supplier.rating ?? null,
    isPreferredSupplier: supplier.isPreferredSupplier,
    contractNumber: supplier.contractNumber ?? null,
    contractStartDate: supplier.contractStartDate
      ? supplier.contractStartDate.toISOString()
      : null,
    contractEndDate: supplier.contractEndDate
      ? supplier.contractEndDate.toISOString()
      : null,
    leadTime: supplier.leadTime ?? null,
    minimumOrderValue: supplier.minimumOrderValue ?? null,
    sequentialCode: supplier.sequentialCode,
    externalId: supplier.externalId ?? null,
    notes: supplier.notes ?? null,

    metadata: supplier.metadata,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
    deletedAt: supplier.deletedAt ? supplier.deletedAt.toISOString() : null,
  };
}
