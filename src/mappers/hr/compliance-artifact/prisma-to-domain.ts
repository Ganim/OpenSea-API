import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ComplianceArtifact,
  type ComplianceArtifactFilters,
  type ComplianceArtifactType,
} from '@/entities/hr/compliance-artifact';
import type { ComplianceArtifact as PrismaComplianceArtifact } from '@prisma/generated/client.js';

/**
 * Converte uma linha Prisma `compliance_artifacts` para a entity de domínio.
 * Nulls do banco viram `undefined` (pattern uniforme com PunchApproval).
 */
export function complianceArtifactPrismaToDomain(
  raw: PrismaComplianceArtifact,
): ComplianceArtifact {
  return ComplianceArtifact.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      type: raw.type as ComplianceArtifactType,
      periodStart: raw.periodStart ?? undefined,
      periodEnd: raw.periodEnd ?? undefined,
      competencia: raw.competencia ?? undefined,
      filters: (raw.filters as ComplianceArtifactFilters | null) ?? undefined,
      storageKey: raw.storageKey,
      contentHash: raw.contentHash,
      sizeBytes: raw.sizeBytes,
      generatedBy: new UniqueEntityID(raw.generatedBy),
      generatedAt: raw.generatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
