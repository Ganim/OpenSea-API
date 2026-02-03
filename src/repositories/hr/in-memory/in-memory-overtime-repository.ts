import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Overtime } from '@/entities/hr/overtime';
import type {
  CreateOvertimeSchema,
  FindOvertimeFilters,
  OvertimeRepository,
  UpdateOvertimeSchema,
} from '../overtime-repository';

export class InMemoryOvertimeRepository implements OvertimeRepository {
  private items: Overtime[] = [];

  async create(data: CreateOvertimeSchema): Promise<Overtime> {
    const id = new UniqueEntityID();
    const overtime = Overtime.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        employeeId: data.employeeId,
        date: data.date,
        hours: data.hours,
        reason: data.reason,
        approved: false,
      },
      id,
    );

    this.items.push(overtime);
    return overtime;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Overtime | null> {
    const overtime = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return overtime || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindOvertimeFilters,
  ): Promise<Overtime[]> {
    let result = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      result = result.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }

    if (filters?.startDate) {
      result = result.filter((item) => item.date >= filters.startDate!);
    }

    if (filters?.endDate) {
      result = result.filter((item) => item.date <= filters.endDate!);
    }

    if (filters?.approved !== undefined) {
      result = result.filter((item) => item.approved === filters.approved);
    }

    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Overtime[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Overtime[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId &&
          item.date >= startDate &&
          item.date <= endDate,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async findManyPending(tenantId: string): Promise<Overtime[]> {
    return this.items
      .filter((item) => !item.approved && item.tenantId.toString() === tenantId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyApproved(tenantId: string): Promise<Overtime[]> {
    return this.items
      .filter((item) => item.approved && item.tenantId.toString() === tenantId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async update(data: UpdateOvertimeSchema): Promise<Overtime | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const existing = this.items[index];

    const updated = Overtime.create(
      {
        tenantId: existing.tenantId,
        employeeId: existing.employeeId,
        date: data.date ?? existing.date,
        hours: data.hours ?? existing.hours,
        reason: data.reason ?? existing.reason,
        approved: data.approved ?? existing.approved,
        approvedBy: data.approvedBy ?? existing.approvedBy,
        approvedAt: data.approvedAt ?? existing.approvedAt,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async save(overtime: Overtime): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(overtime.id));

    if (index !== -1) {
      this.items[index] = overtime;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
