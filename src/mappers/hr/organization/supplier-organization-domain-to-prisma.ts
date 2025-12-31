import type { Supplier } from '@/entities/hr/organization/supplier';

export function mapSupplierOrganizationDomainToPrisma(supplier: Supplier) {
  return {
    type: 'SUPPLIER' as const,
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
    typeSpecificData: {
      paymentTerms: supplier.paymentTerms ?? null,
      rating: supplier.rating ?? null,
      isPreferredSupplier: supplier.isPreferredSupplier,
      contractNumber: supplier.contractNumber ?? null,
      contractStartDate: supplier.contractStartDate ?? null,
      contractEndDate: supplier.contractEndDate ?? null,
      leadTime: supplier.leadTime ?? null,
      minimumOrderValue: supplier.minimumOrderValue ?? null,
      sequentialCode: supplier.sequentialCode,
      externalId: supplier.externalId ?? null,
      notes: supplier.notes ?? null,
    },
    metadata: supplier.metadata ?? {},
    deletedAt: supplier.deletedAt ?? null,
  };
}
