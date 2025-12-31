import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Manufacturer,
  type ManufacturerProps,
  type ManufacturerSpecificData,
} from '@/entities/hr/organization/manufacturer';
import type {
  TaxRegime,
  OrganizationStatus,
} from '@/entities/hr/organization/organization';

interface ManufacturerTypeSpecificDataShape {
  productionCapacity?: number | null;
  leadTime?: number | null;
  certifications?: string[];
  qualityRating?: number | null;
  defectRate?: number | null;
  minimumOrderQuantity?: number | null;
  paymentTerms?: string | null;
  countryOfOrigin?: string | null;
  factoryLocation?: string | null;
  sequentialCode?: number;
  externalId?: string | null;
  notes?: string | null;
}

export function mapManufacturerOrganizationPrismaToDomain(
  raw: Record<string, unknown>,
): Manufacturer {
  // Extrair dados específicos de Manufacturer do typeSpecificData
  const typeSpecificData =
    (raw.typeSpecificData as ManufacturerTypeSpecificDataShape) ?? {};
  const manufacturerData: ManufacturerSpecificData = {
    productionCapacity: typeSpecificData.productionCapacity ?? null,
    leadTime: typeSpecificData.leadTime ?? null,
    certifications: typeSpecificData.certifications ?? [],
    qualityRating: typeSpecificData.qualityRating ?? null,
    defectRate: typeSpecificData.defectRate ?? null,
    minimumOrderQuantity: typeSpecificData.minimumOrderQuantity ?? null,
    paymentTerms: typeSpecificData.paymentTerms ?? null,
    countryOfOrigin: typeSpecificData.countryOfOrigin ?? null,
    factoryLocation: typeSpecificData.factoryLocation ?? null,
    sequentialCode: typeSpecificData.sequentialCode ?? undefined,
    externalId: typeSpecificData.externalId ?? null,
    notes: typeSpecificData.notes ?? null,
  };

  const props: ManufacturerProps = {
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
    typeSpecificData: manufacturerData,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    deletedAt: (raw.deletedAt as Date | null) ?? undefined,
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };

  return Manufacturer.create(props, new UniqueEntityID(raw.id as string));
}
