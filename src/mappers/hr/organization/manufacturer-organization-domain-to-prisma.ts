import type { Manufacturer } from '@/entities/hr/organization/manufacturer';

export function mapManufacturerOrganizationDomainToPrisma(
  manufacturer: Manufacturer,
) {
  return {
    type: 'MANUFACTURER' as const,
    legalName: manufacturer.legalName,
    cnpj: manufacturer.cnpj ?? null,
    cpf: manufacturer.cpf ?? null,
    tradeName: manufacturer.tradeName ?? null,
    stateRegistration: manufacturer.stateRegistration ?? null,
    municipalRegistration: manufacturer.municipalRegistration ?? null,
    taxRegime: manufacturer.taxRegime ?? null,
    status: manufacturer.status,
    email: manufacturer.email ?? null,
    phoneMain: manufacturer.phoneMain ?? null,
    website: manufacturer.website ?? null,
    typeSpecificData: {
      productionCapacity: manufacturer.productionCapacity ?? null,
      leadTime: manufacturer.leadTime ?? null,
      certifications: manufacturer.certifications ?? [],
      qualityRating: manufacturer.qualityRating ?? null,
      defectRate: manufacturer.defectRate ?? null,
      minimumOrderQuantity: manufacturer.minimumOrderQuantity ?? null,
      paymentTerms: manufacturer.paymentTerms ?? null,
      countryOfOrigin: manufacturer.countryOfOrigin ?? null,
      factoryLocation: manufacturer.factoryLocation ?? null,
      sequentialCode: manufacturer.sequentialCode,
      externalId: manufacturer.externalId ?? null,
      notes: manufacturer.notes ?? null,
    },
    metadata: manufacturer.metadata ?? {},
    deletedAt: manufacturer.deletedAt ?? null,
  };
}
