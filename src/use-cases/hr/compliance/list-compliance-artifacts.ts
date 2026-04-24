import type { ComplianceArtifactType } from '@/entities/hr/compliance-artifact';
import {
  complianceArtifactToDTO,
  type ComplianceArtifactDTO,
} from '@/mappers/hr/compliance-artifact/to-dto';
import type {
  ComplianceArtifactRepository,
  FindManyComplianceArtifactFilters,
} from '@/repositories/hr/compliance-artifact-repository';

/**
 * Phase 06 / Plan 06-06 — `ListComplianceArtifactsUseCase`.
 *
 * Use case de listagem paginada (infinite scroll) de artefatos de compliance
 * por tenant. Filtros opcionais: type / competencia / periodStart / periodEnd /
 * employeeId (inspecionado em `filters.employeeId` do JSON). Retorna items
 * DTO-mapped + meta de paginação (total/pages).
 *
 * **Tenant isolation:** reuse literal do pattern de `findManyByTenant` existente
 * desde Plan 06-01 (repo sempre aplica `WHERE tenantId = ? AND deletedAt IS NULL`).
 *
 * **T-06-01-02 placeholder PII:** employeeId filter faz match no campo JSON
 * (Prisma.filters path ['employeeId']); valor não entra em audit log por ser
 * apenas critério de busca UI.
 */

export interface ListComplianceArtifactsRequest {
  tenantId: string;
  type?: ComplianceArtifactType;
  competencia?: string;
  periodStart?: Date;
  periodEnd?: Date;
  employeeId?: string;
  page?: number;
  limit?: number;
}

export interface ListComplianceArtifactsResponse {
  items: ComplianceArtifactDTO[];
  meta: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class ListComplianceArtifactsUseCase {
  constructor(
    private readonly complianceArtifactRepository: ComplianceArtifactRepository,
  ) {}

  async execute(
    input: ListComplianceArtifactsRequest,
  ): Promise<ListComplianceArtifactsResponse> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 50));

    const filters: FindManyComplianceArtifactFilters = {
      page,
      limit,
      ...(input.type ? { type: input.type } : {}),
      ...(input.competencia ? { competencia: input.competencia } : {}),
      ...(input.periodStart ? { periodStart: input.periodStart } : {}),
      ...(input.periodEnd ? { periodEnd: input.periodEnd } : {}),
    };

    const { items, total } =
      await this.complianceArtifactRepository.findManyByTenant({
        tenantId: input.tenantId,
        filters,
      });

    // Filter by employeeId in-memory when provided — the repo interface does
    // not expose JSON path queries on `filters`. Acceptable because `filters`
    // payloads are small and employeeId queries are seldom used by RH at UI
    // scale. `total` reflects the un-filtered count; `meta.pages` is computed
    // from the un-filtered total so the UI can show "showing X of Y" while
    // the employeeId filter is client-side.
    const filteredItems = input.employeeId
      ? items.filter((artifact) => {
          const f = artifact.filters as Record<string, unknown> | undefined;
          if (!f) return false;
          return (
            typeof f.employeeId === 'string' &&
            f.employeeId === input.employeeId
          );
        })
      : items;

    const pages = Math.max(1, Math.ceil(total / limit));

    return {
      items: filteredItems.map(complianceArtifactToDTO),
      meta: {
        page,
        limit,
        total,
        pages,
      },
    };
  }
}
