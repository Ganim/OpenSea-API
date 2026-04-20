import type {
  ComplianceArtifact,
  ComplianceArtifactType,
} from '@/entities/hr/compliance-artifact';

/**
 * DTO público de `ComplianceArtifact`.
 *
 * Inclui `contentHash` (cliente pode usar para integridade) e `filters`
 * (transparência de quais critérios geraram). Omite `deletedAt` — soft-delete
 * é detalhe de implementação interna; entries deletadas não aparecem nas
 * listagens em primeiro lugar.
 */
export interface ComplianceArtifactDTO {
  id: string;
  tenantId: string;
  type: ComplianceArtifactType;
  periodStart: string | null;
  periodEnd: string | null;
  competencia: string | null;
  filters: Record<string, unknown> | null;
  storageKey: string;
  contentHash: string;
  sizeBytes: number;
  generatedBy: string;
  generatedAt: string;
}

export function complianceArtifactToDTO(
  artifact: ComplianceArtifact,
): ComplianceArtifactDTO {
  return {
    id: artifact.id.toString(),
    tenantId: artifact.tenantId.toString(),
    type: artifact.type,
    periodStart: artifact.periodStart?.toISOString() ?? null,
    periodEnd: artifact.periodEnd?.toISOString() ?? null,
    competencia: artifact.competencia ?? null,
    filters: artifact.filters ?? null,
    storageKey: artifact.storageKey,
    contentHash: artifact.contentHash,
    sizeBytes: artifact.sizeBytes,
    generatedBy: artifact.generatedBy.toString(),
    generatedAt: artifact.generatedAt.toISOString(),
  };
}
