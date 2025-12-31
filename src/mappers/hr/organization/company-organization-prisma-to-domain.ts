import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  Company,
  type CompanyProps,
  type CompanySpecificData,
} from '@/entities/hr/organization/company';
import type {
  OrganizationStatus,
  TaxRegime,
} from '@/entities/hr/organization/organization';
import type { Organization as PrismaOrganization } from '@prisma/client';

interface TypeSpecificDataShape {
  legalNature?: string | null;
  taxRegimeDetail?: string | null;
  activityStartDate?: string | null;
  phoneAlt?: string | null;
  logoUrl?: string | null;
  pendingIssues?: string[];
}

export function mapCompanyOrganizationPrismaToDomain(
  raw: PrismaOrganization,
): Company {
  // Extrair dados específicos de Company do typeSpecificData
  const typeSpecificData =
    (raw.typeSpecificData as TypeSpecificDataShape) ?? {};
  const companyData: CompanySpecificData = {
    legalNature: typeSpecificData.legalNature ?? null,
    taxRegimeDetail: typeSpecificData.taxRegimeDetail ?? null,
    activityStartDate: typeSpecificData.activityStartDate
      ? new Date(typeSpecificData.activityStartDate)
      : null,
    phoneAlt: typeSpecificData.phoneAlt ?? null,
    logoUrl: typeSpecificData.logoUrl ?? null,
    pendingIssues: typeSpecificData.pendingIssues ?? [],
  };

  const props: CompanyProps = {
    legalName: raw.legalName,
    cnpj: raw.cnpj ?? undefined,
    cpf: raw.cpf ?? undefined,
    tradeName: raw.tradeName ?? undefined,
    stateRegistration: raw.stateRegistration ?? undefined,
    municipalRegistration: raw.municipalRegistration ?? undefined,
    taxRegime: (raw.taxRegime as TaxRegime) ?? undefined,
    status: raw.status as OrganizationStatus,
    email: raw.email ?? undefined,
    phoneMain: raw.phoneMain ?? undefined,
    website: raw.website ?? undefined,
    typeSpecificData: companyData,
    metadata: (raw.metadata as Record<string, unknown>) ?? {},
    deletedAt: raw.deletedAt ?? undefined,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };

  return Company.create(props, new UniqueEntityID(raw.id));
}
