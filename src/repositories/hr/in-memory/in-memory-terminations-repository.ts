import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Termination } from '@/entities/hr/termination';
import type {
  CreateTerminationSchema,
  FindTerminationFilters,
  TerminationsRepository,
  UpdateTerminationSchema,
} from '../terminations-repository';

export class InMemoryTerminationsRepository implements TerminationsRepository {
  public items: Termination[] = [];

  async create(data: CreateTerminationSchema): Promise<Termination> {
    const termination = Termination.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      type: data.type,
      terminationDate: data.terminationDate,
      lastWorkDay: data.lastWorkDay,
      noticeType: data.noticeType,
      noticeDays: data.noticeDays,
      paymentDeadline: data.paymentDeadline,
      notes: data.notes,
    });

    this.items.push(termination);
    return termination;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
    _tx?: unknown,
  ): Promise<Termination | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Termination | null> {
    return (
      this.items.find(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindTerminationFilters,
  ): Promise<Termination[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }
    if (filters?.type) {
      filtered = filtered.filter((item) => item.type === filters.type);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(
        (item) => item.terminationDate >= filters.startDate!,
      );
    }
    if (filters?.endDate) {
      filtered = filtered.filter(
        (item) => item.terminationDate <= filters.endDate!,
      );
    }

    const sorted = filtered.sort(
      (a, b) => b.terminationDate.getTime() - a.terminationDate.getTime(),
    );

    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    return sorted.slice((page - 1) * perPage, page * perPage);
  }

  async countMany(
    tenantId: string,
    filters?: FindTerminationFilters,
  ): Promise<number> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter((item) => item.status === filters.status);
    }
    if (filters?.type) {
      filtered = filtered.filter((item) => item.type === filters.type);
    }
    if (filters?.startDate) {
      filtered = filtered.filter(
        (item) => item.terminationDate >= filters.startDate!,
      );
    }
    if (filters?.endDate) {
      filtered = filtered.filter(
        (item) => item.terminationDate <= filters.endDate!,
      );
    }

    return filtered.length;
  }

  async update(data: UpdateTerminationSchema): Promise<Termination | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        (!data.tenantId || item.tenantId.toString() === data.tenantId),
    );
    if (index === -1) return null;

    const termination = this.items[index];

    if (data.notes !== undefined) {
      termination.updateNotes(data.notes);
    }

    return termination;
  }

  async save(termination: Termination, _tx?: unknown): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(termination.id),
    );
    if (index >= 0) {
      this.items[index] = termination;
    }
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
