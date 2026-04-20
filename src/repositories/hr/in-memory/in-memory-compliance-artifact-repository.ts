import type { ComplianceArtifact } from '@/entities/hr/compliance-artifact';
import type {
  ComplianceArtifactRepository,
  FindManyComplianceArtifactFilters,
} from '../compliance-artifact-repository';

/**
 * In-memory para unit tests. Espelha exatamente a semântica da impl Prisma:
 * - findById/findManyByTenant excluem soft-deleted
 * - findByIdWithoutTenant inclui soft-deleted
 * - findManyByTenant ordena por generatedAt DESC e pagina
 * - softDelete idempotente
 */
export class InMemoryComplianceArtifactRepository
  implements ComplianceArtifactRepository
{
  public items: ComplianceArtifact[] = [];

  async create(artifact: ComplianceArtifact): Promise<void> {
    this.items.push(artifact);
  }

  async findById(
    id: string,
    tenantId: string,
  ): Promise<ComplianceArtifact | null> {
    return (
      this.items.find(
        (a) =>
          a.id.toString() === id &&
          a.tenantId.toString() === tenantId &&
          !a.isDeleted,
      ) ?? null
    );
  }

  async findByIdWithoutTenant(id: string): Promise<ComplianceArtifact | null> {
    return this.items.find((a) => a.id.toString() === id) ?? null;
  }

  async findManyByTenant(params: {
    tenantId: string;
    filters?: FindManyComplianceArtifactFilters;
  }): Promise<{ items: ComplianceArtifact[]; total: number }> {
    const { tenantId, filters = {} } = params;
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 50;

    const matched = this.items.filter((a) => {
      if (a.tenantId.toString() !== tenantId) return false;
      if (a.isDeleted) return false;
      if (filters.type && a.type !== filters.type) return false;
      if (filters.competencia && a.competencia !== filters.competencia)
        return false;
      if (
        filters.periodStart &&
        (!a.periodStart || a.periodStart < filters.periodStart)
      ) {
        return false;
      }
      if (
        filters.periodEnd &&
        (!a.periodEnd || a.periodEnd > filters.periodEnd)
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...matched].sort(
      (a, b) => b.generatedAt.getTime() - a.generatedAt.getTime(),
    );
    const start = (page - 1) * limit;
    const paginated = sorted.slice(start, start + limit);

    return { items: paginated, total: matched.length };
  }

  async softDelete(id: string, tenantId: string): Promise<void> {
    const artifact = this.items.find(
      (a) =>
        a.id.toString() === id &&
        a.tenantId.toString() === tenantId &&
        !a.isDeleted,
    );
    if (artifact) {
      artifact.softDelete();
    }
  }
}
