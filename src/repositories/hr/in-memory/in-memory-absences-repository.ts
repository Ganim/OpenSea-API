import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Absence } from '@/entities/hr/absence';
import { AbsenceStatus, AbsenceType } from '@/entities/hr/value-objects';
import type {
  AbsencesRepository,
  CreateAbsenceSchema,
  FindAbsenceFilters,
  UpdateAbsenceSchema,
} from '../absences-repository';

export class InMemoryAbsencesRepository implements AbsencesRepository {
  public items: Absence[] = [];

  async create(data: CreateAbsenceSchema): Promise<Absence> {
    const absence = Absence.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      type: AbsenceType.create(data.type),
      status: AbsenceStatus.pending(),
      startDate: data.startDate,
      endDate: data.endDate,
      totalDays: data.totalDays,
      reason: data.reason,
      documentUrl: data.documentUrl,
      cid: data.cid,
      isPaid: data.isPaid,
      isInssResponsibility: data.isInssResponsibility,
      vacationPeriodId: data.vacationPeriodId,
      requestedBy: data.requestedBy,
      notes: data.notes,
    });

    this.items.push(absence);
    return absence;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Absence | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindAbsenceFilters,
  ): Promise<Absence[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.type) {
      filtered = filtered.filter((item) => item.type.value === filters.type);
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (item) => item.status.value === filters.status,
      );
    }
    if (filters?.startDate) {
      filtered = filtered.filter(
        (item) => item.startDate >= filters.startDate!,
      );
    }
    if (filters?.endDate) {
      filtered = filtered.filter((item) => item.endDate <= filters.endDate!);
    }

    return filtered.sort(
      (a, b) => b.startDate.getTime() - a.startDate.getTime(),
    );
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Absence[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Absence[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          item.overlapsWithDateRange(startDate, endDate),
      )
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  }

  async findManyByStatus(status: string, tenantId: string): Promise<Absence[]> {
    return this.items
      .filter(
        (item) =>
          item.status.value === status && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime());
  }

  async findManyPending(tenantId: string): Promise<Absence[]> {
    return this.findManyByStatus('PENDING', tenantId);
  }

  async findOverlapping(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
    excludeId?: UniqueEntityID,
  ): Promise<Absence[]> {
    return this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId &&
        !item.status.isRejected() &&
        !item.status.isCancelled() &&
        item.overlapsWithDateRange(startDate, endDate) &&
        (!excludeId || !item.id.equals(excludeId)),
    );
  }

  async countByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
    tenantId: string,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId &&
        item.type.value === type &&
        !item.status.isRejected() &&
        !item.status.isCancelled() &&
        item.startDate >= startOfYear &&
        item.startDate <= endOfYear,
    ).length;
  }

  async sumDaysByEmployeeAndType(
    employeeId: UniqueEntityID,
    type: string,
    year: number,
    tenantId: string,
  ): Promise<number> {
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31);

    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          item.type.value === type &&
          !item.status.isRejected() &&
          !item.status.isCancelled() &&
          item.startDate >= startOfYear &&
          item.startDate <= endOfYear,
      )
      .reduce((sum, item) => sum + item.totalDays, 0);
  }

  async update(data: UpdateAbsenceSchema): Promise<Absence | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const absence = this.items[index];

    // Update would mutate the entity - this is a simplified implementation
    // In real scenario, you'd create a new instance or use proper update methods

    return absence;
  }

  async save(absence: Absence): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(absence.id));
    if (index >= 0) {
      this.items[index] = absence;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
