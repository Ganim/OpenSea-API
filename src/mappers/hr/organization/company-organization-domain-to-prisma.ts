import type { Company } from '@/entities/hr/organization/company';

export function mapCompanyOrganizationDomainToPrisma(company: Company) {
  return {
    type: 'COMPANY' as const,
    legalName: company.legalName,
    cnpj: company.cnpj ?? null,
    cpf: company.cpf ?? null,
    tradeName: company.tradeName ?? null,
    stateRegistration: company.stateRegistration ?? null,
    municipalRegistration: company.municipalRegistration ?? null,
    taxRegime: company.taxRegime ?? null,
    status: company.status,
    email: company.email ?? null,
    phoneMain: company.phoneMain ?? null,
    website: company.website ?? null,
    typeSpecificData: {
      legalNature: company.legalNature ?? null,
      taxRegimeDetail: company.taxRegimeDetail ?? null,
      activityStartDate: company.activityStartDate ?? null,
      phoneAlt: company.phoneAlt ?? null,
      logoUrl: company.logoUrl ?? null,
      pendingIssues: company.pendingIssues ?? [],
    },
    metadata: company.metadata ?? {},
    deletedAt: company.deletedAt ?? null,
  };
}
