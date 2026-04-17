import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OffboardingChecklist } from '@/entities/hr/offboarding-checklist';
import type {
  FindManyOffboardingChecklistsParams,
  FindManyOffboardingChecklistsResult,
  OffboardingChecklistsRepository,
} from '../offboarding-checklists-repository';

export class InMemoryOffboardingChecklistsRepository
  implements OffboardingChecklistsRepository
{
  public items: OffboardingChecklist[] = [];

  async create(checklist: OffboardingChecklist): Promise<void> {
    this.items.push(checklist);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OffboardingChecklist | null> {
    return (
      this.items.find(
        (checklist) =>
          checklist.id.equals(id) &&
          checklist.tenantId.toString() === tenantId &&
          !checklist.isDeleted(),
      ) ?? null
    );
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<OffboardingChecklist | null> {
    return (
      this.items.find(
        (checklist) =>
          checklist.employeeId.equals(employeeId) &&
          checklist.tenantId.toString() === tenantId &&
          !checklist.isDeleted(),
      ) ?? null
    );
  }

  async findMany(
    params: FindManyOffboardingChecklistsParams,
  ): Promise<FindManyOffboardingChecklistsResult> {
    let filtered = this.items.filter(
      (checklist) =>
        checklist.tenantId.toString() === params.tenantId &&
        !checklist.isDeleted(),
    );

    if (params.employeeId) {
      filtered = filtered.filter(
        (checklist) => checklist.employeeId.toString() === params.employeeId,
      );
    }

    if (params.status === 'COMPLETED') {
      filtered = filtered.filter((checklist) => checklist.isComplete());
    } else if (params.status === 'IN_PROGRESS') {
      filtered = filtered.filter((checklist) => !checklist.isComplete());
    }

    if (params.search) {
      const searchLower = params.search.toLowerCase();
      filtered = filtered.filter((checklist) =>
        checklist.title.toLowerCase().includes(searchLower),
      );
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.perPage;
    const paginatedChecklists = filtered.slice(start, start + params.perPage);

    return { checklists: paginatedChecklists, total };
  }

  async save(checklist: OffboardingChecklist): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(checklist.id));
    if (index >= 0) {
      this.items[index] = checklist;
    }
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const checklist = this.items.find((item) => item.id.equals(id));
    if (checklist) {
      checklist.softDelete();
    }
  }
}
