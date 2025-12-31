import type { Manufacturer } from '@/entities/hr/organization/manufacturer';

export interface ManufacturerDTO {
  id: string;
  type: 'MANUFACTURER';
  legalName: string;
  cnpj?: string | null;
  cpf?: string | null;
  tradeName?: string | null;
  stateRegistration?: string | null;
  municipalRegistration?: string | null;
  taxRegime?: string | null;
  status: string;
  isActive: boolean;
  email?: string | null;
  phoneMain?: string | null;
  website?: string | null;

  // Manufacturer specific fields
  productionCapacity?: number | null;
  leadTime?: number | null;
  certifications: string[];
  qualityRating?: number | null;
  defectRate?: number | null;
  minimumOrderQuantity?: number | null;
  paymentTerms?: string | null;
  countryOfOrigin?: string | null;
  factoryLocation?: string | null;
  sequentialCode?: number;
  externalId?: string | null;
  notes?: string | null;

  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export function manufacturerToDTO(manufacturer: Manufacturer): ManufacturerDTO {
  return {
    id: manufacturer.id.toString(),
    type: 'MANUFACTURER',
    legalName: manufacturer.legalName,
    cnpj: manufacturer.cnpj ?? null,
    cpf: manufacturer.cpf ?? null,
    tradeName: manufacturer.tradeName ?? null,
    stateRegistration: manufacturer.stateRegistration ?? null,
    municipalRegistration: manufacturer.municipalRegistration ?? null,
    taxRegime: manufacturer.taxRegime ?? null,
    status: manufacturer.status,
    email: manufacturer.email ?? null,
    isActive: manufacturer.isActive(),
    phoneMain: manufacturer.phoneMain ?? null,
    website: manufacturer.website ?? null,

    // Manufacturer specific fields
    productionCapacity: manufacturer.productionCapacity ?? null,
    leadTime: manufacturer.leadTime ?? null,
    certifications: manufacturer.certifications,
    qualityRating: manufacturer.qualityRating ?? null,
    defectRate: manufacturer.defectRate ?? null,
    minimumOrderQuantity: manufacturer.minimumOrderQuantity ?? null,
    paymentTerms: manufacturer.paymentTerms ?? null,
    countryOfOrigin: manufacturer.countryOfOrigin ?? null,
    factoryLocation: manufacturer.factoryLocation ?? null,
    sequentialCode: manufacturer.sequentialCode,
    externalId: manufacturer.externalId ?? null,
    notes: manufacturer.notes ?? null,

    metadata: manufacturer.metadata,
    createdAt: manufacturer.createdAt.toISOString(),
    updatedAt: manufacturer.updatedAt.toISOString(),
    deletedAt: manufacturer.deletedAt
      ? manufacturer.deletedAt.toISOString()
      : null,
  };
}
