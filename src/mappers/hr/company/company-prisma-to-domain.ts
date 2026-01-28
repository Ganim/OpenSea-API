import type {
  CompanyProps,
  CompanyStatus,
  TaxRegime,
} from '@/entities/hr/company';
import type { Company as PrismaCompany } from '@prisma/generated/client.js';

export function mapCompanyPrismaToDomain(raw: PrismaCompany): CompanyProps {
  return {
    legalName: raw.legalName,
    cnpj: raw.cnpj,
    tradeName: raw.tradeName ?? undefined,
    stateRegistration: raw.stateRegistration ?? undefined,
    municipalRegistration: raw.municipalRegistration ?? undefined,
    legalNature: raw.legalNature ?? undefined,
    taxRegime: (raw.taxRegime as TaxRegime) ?? undefined,
    taxRegimeDetail: raw.taxRegimeDetail ?? undefined,
    activityStartDate: raw.activityStartDate ?? undefined,
    status: raw.status as CompanyStatus,
    email: raw.email ?? undefined,
    phoneMain: raw.phoneMain ?? undefined,
    phoneAlt: raw.phoneAlt ?? undefined,
    logoUrl: raw.logoUrl ?? undefined,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    pendingIssues: (raw.pendingIssues as string[]) ?? [],
    deletedAt: raw.deletedAt ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
