import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Supplier,
  type SupplierProps,
  type SupplierSpecificData,
} from '@/entities/hr/organization/supplier';
import type {
  TaxRegime,
  OrganizationStatus,
} from '@/entities/hr/organization/organization';

interface SupplierTypeSpecificDataShape {
  paymentTerms?: string | null;
  rating?: number | null;
  isPreferredSupplier?: boolean;
  contractNumber?: string | null;
  contractStartDate?: string | Date | null;
  contractEndDate?: string | Date | null;
  leadTime?: number | null;
  minimumOrderValue?: number | null;
  sequentialCode?: number;
  externalId?: string | null;
  notes?: string | null;
}

export function mapSupplierOrganizationPrismaToDomain(
  raw: Record<string, unknown>,
): Supplier {
  // Extrair dados específicos de Supplier do typeSpecificData
  const typeSpecificData =
    (raw.typeSpecificData as SupplierTypeSpecificDataShape) ?? {};
  const supplierData: SupplierSpecificData = {
    paymentTerms: typeSpecificData.paymentTerms ?? null,
    rating: typeSpecificData.rating ?? null,
    isPreferredSupplier: typeSpecificData.isPreferredSupplier ?? false,
    contractNumber: typeSpecificData.contractNumber ?? null,
    contractStartDate: typeSpecificData.contractStartDate
      ? new Date(typeSpecificData.contractStartDate)
      : null,
    contractEndDate: typeSpecificData.contractEndDate
      ? new Date(typeSpecificData.contractEndDate)
      : null,
    leadTime: typeSpecificData.leadTime ?? null,
    minimumOrderValue: typeSpecificData.minimumOrderValue ?? null,
    sequentialCode: typeSpecificData.sequentialCode ?? undefined,
    externalId: typeSpecificData.externalId ?? null,
    notes: typeSpecificData.notes ?? null,
  };

  const props: SupplierProps = {
    legalName: raw.legalName as string,
    cnpj: (raw.cnpj as string | null) ?? undefined,
    cpf: (raw.cpf as string | null) ?? undefined,
    tradeName: (raw.tradeName as string | null) ?? undefined,
    stateRegistration: (raw.stateRegistration as string | null) ?? undefined,
    municipalRegistration:
      (raw.municipalRegistration as string | null) ?? undefined,
    taxRegime: (raw.taxRegime as TaxRegime | null) ?? undefined,
    status: raw.status as OrganizationStatus,
    email: (raw.email as string | null) ?? undefined,
    phoneMain: (raw.phoneMain as string | null) ?? undefined,
    website: (raw.website as string | null) ?? undefined,
    typeSpecificData: supplierData,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    deletedAt: (raw.deletedAt as Date | null) ?? undefined,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };

  return Supplier.create(props, new UniqueEntityID(raw.id as string));
}
