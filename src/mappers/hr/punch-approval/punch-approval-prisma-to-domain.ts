import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  PunchApproval,
  type EvidenceFile,
  type PunchApprovalReason,
  type PunchApprovalStatus,
} from '@/entities/hr/punch-approval';
import type { PunchApproval as PrismaPunchApproval } from '@prisma/generated/client.js';

/**
 * Parse defensivo do JSONB `evidence_files`. Aceita null/undefined (coluna
 * aditiva recém-introduzida em 07-01) e filtra entradas que não tenham a
 * shape esperada. Evita panic no runtime caso alguém escreva payload bruto
 * via SQL direto — sanity check, não validação de autoridade.
 */
function parseEvidenceFiles(raw: unknown): EvidenceFile[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (it): it is EvidenceFile =>
      typeof it === 'object' &&
      it !== null &&
      typeof (it as EvidenceFile).storageKey === 'string' &&
      typeof (it as EvidenceFile).filename === 'string' &&
      typeof (it as EvidenceFile).size === 'number' &&
      typeof (it as EvidenceFile).uploadedAt === 'string' &&
      typeof (it as EvidenceFile).uploadedBy === 'string',
  );
}

/**
 * Converte a linha Prisma para a entity de domínio. Campos `null` do banco
 * viram `undefined` em `Optional<...>` (pattern consistente com o mapper
 * de PunchDevice).
 *
 * Phase 7 / Plan 07-03: hidrata `evidenceFiles` (JSONB) e `linkedRequestId`
 * (FK nullable) — ambos introduzidos em 07-01. Colunas legadas sem essas
 * propriedades (registros Phase 4/5) rendem entity com `evidenceFiles: []`
 * e `linkedRequestId: null`.
 */
export function punchApprovalPrismaToDomain(
  raw: PrismaPunchApproval & {
    evidenceFiles?: unknown;
    linkedRequestId?: string | null;
  },
): PunchApproval {
  return PunchApproval.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      timeEntryId: new UniqueEntityID(raw.timeEntryId),
      employeeId: new UniqueEntityID(raw.employeeId),
      reason: raw.reason as PunchApprovalReason,
      details: (raw.details as Record<string, unknown> | null) ?? undefined,
      status: raw.status as PunchApprovalStatus,
      resolverUserId: raw.resolverUserId
        ? new UniqueEntityID(raw.resolverUserId)
        : undefined,
      resolvedAt: raw.resolvedAt ?? undefined,
      resolverNote: raw.resolverNote ?? undefined,
      evidenceFiles: parseEvidenceFiles(raw.evidenceFiles),
      linkedRequestId: raw.linkedRequestId
        ? new UniqueEntityID(raw.linkedRequestId)
        : null,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
