import type {
  ComplianceArtifact,
  ComplianceArtifactType,
} from '@/entities/hr/compliance-artifact';

/**
 * Filtros opcionais para listagem paginada de ComplianceArtifact.
 *
 * Defaults:
 * - `page = 1`
 * - `limit = 50` (frontend de compliance lista lotes maiores que CRUDs comuns;
 *    máx 100 enforçado pelo controller via Zod no Plan 06-06).
 *
 * Filtros mutuamente compatíveis: `type` AND `competencia` AND janela
 * `periodStart`/`periodEnd` (interseção lógica).
 */
export interface FindManyComplianceArtifactFilters {
  type?: ComplianceArtifactType;
  competencia?: string;
  periodStart?: Date;
  periodEnd?: Date;
  page?: number;
  limit?: number;
}

export interface ComplianceArtifactRepository {
  /** Cria um novo artefato. Não há `save` — entity é imutável após create. */
  create(artifact: ComplianceArtifact): Promise<void>;

  /**
   * Busca por id com isolamento de tenant. Retorna `null` se não existir
   * OU se `tenantId` não bater OU se estiver soft-deleted (deletedAt IS NOT NULL).
   */
  findById(id: string, tenantId: string): Promise<ComplianceArtifact | null>;

  /**
   * Busca por id IGNORANDO tenant. Usado APENAS por jobs internos / scripts
   * de manutenção que precisam acessar registros de qualquer tenant
   * (ex: garbage collector de storage). Inclui soft-deleted.
   */
  findByIdWithoutTenant(id: string): Promise<ComplianceArtifact | null>;

  /**
   * Lista paginada filtrando por tenant + critérios opcionais. Sempre exclui
   * registros soft-deleted (deletedAt IS NULL). Ordenado por `generatedAt DESC`.
   */
  findManyByTenant(params: {
    tenantId: string;
    filters?: FindManyComplianceArtifactFilters;
  }): Promise<{ items: ComplianceArtifact[]; total: number }>;

  /**
   * Marca como soft-deleted. Idempotente (se já estiver deletado, no-op).
   * Tenant guard: opera apenas se `tenantId` bate.
   */
  softDelete(id: string, tenantId: string): Promise<void>;
}
