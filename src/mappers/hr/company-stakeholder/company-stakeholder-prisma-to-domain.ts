import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  CompanyStakeholderRole,
  CompanyStakeholderSource,
  CompanyStakeholderStatus,
} from '@/entities/hr/company-stakeholder';
import { CompanyStakeholder } from '@/entities/hr';
import { CompanyStakeholder as PrismaCompanyStakeholder } from '@prisma/client';

export function mapCompanyStakeholderPrismaToDomain(
  raw: PrismaCompanyStakeholder,
): CompanyStakeholder {
  return CompanyStakeholder.create(
    {
      companyId: new UniqueEntityID(raw.companyId),
      name: raw.name,
      role: (raw.role as CompanyStakeholderRole) ?? undefined,
      entryDate: raw.entryDate ?? undefined,
      exitDate: raw.exitDate ?? undefined,
      personDocumentMasked: raw.personDocumentMasked ?? undefined,
      isLegalRepresentative: raw.isLegalRepresentative,
      status: raw.status as CompanyStakeholderStatus,
      source: raw.source as CompanyStakeholderSource,
      rawPayloadRef: raw.rawPayloadRef ?? undefined,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      pendingIssues: (raw.pendingIssues as string[]) ?? [],
      anonimizedAt: raw.anonimizedAt ?? undefined,
      deletedAt: raw.deletedAt ?? undefined,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}
