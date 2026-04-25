import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchApproval } from '@/entities/hr/punch-approval';
import type {
  FindManyPunchApprovalsFilters,
  PunchApprovalsRepository,
} from '../punch-approvals-repository';

/**
 * In-memory implementation usada por specs unitários. Espelha a semântica
 * do `PrismaPunchApprovalsRepository`:
 * - `tenantId` filtra todas as queries
 * - `save` substitui por id
 * - `findManyByTenantId` ordena desc por createdAt, pagina por page/pageSize
 */
export class InMemoryPunchApprovalsRepository implements PunchApprovalsRepository {
  public items: PunchApproval[] = [];

  async create(approval: PunchApproval): Promise<void> {
    this.items.push(approval);
  }

  async save(approval: PunchApproval): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === approval.id.toString(),
    );

    if (index >= 0) {
      this.items[index] = approval;
    }
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchApproval | null> {
    return (
      this.items.find(
        (approval) =>
          approval.id.toString() === id.toString() &&
          approval.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByTimeEntryId(
    timeEntryId: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchApproval | null> {
    return (
      this.items.find(
        (approval) =>
          approval.timeEntryId?.toString() === timeEntryId.toString() &&
          approval.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findManyByTenantId(
    tenantId: string,
    filters: FindManyPunchApprovalsFilters = {},
  ): Promise<{ items: PunchApproval[]; total: number }> {
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 20;

    const filtered = this.items.filter((approval) => {
      if (approval.tenantId.toString() !== tenantId) return false;
      if (filters.status && approval.status !== filters.status) return false;
      if (filters.reason && approval.reason !== filters.reason) return false;
      if (
        filters.employeeId &&
        approval.employeeId.toString() !== filters.employeeId
      ) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );

    const start = (page - 1) * pageSize;
    const paginated = sorted.slice(start, start + pageSize);

    return { items: paginated, total: filtered.length };
  }

  async countByEmployeeAndStatus(
    employeeId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED',
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (a) =>
        a.employeeId.toString() === employeeId &&
        a.status === status &&
        a.tenantId.toString() === tenantId,
    ).length;
  }
}
