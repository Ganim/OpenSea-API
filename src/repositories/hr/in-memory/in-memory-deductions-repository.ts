import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Deduction } from '@/entities/hr/deduction';
import type {
  CreateDeductionSchema,
  DeductionsRepository,
  FindDeductionFilters,
  UpdateDeductionSchema,
} from '../deductions-repository';

export class InMemoryDeductionsRepository implements DeductionsRepository {
  public items: Deduction[] = [];

  async create(data: CreateDeductionSchema): Promise<Deduction> {
    const deduction = Deduction.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      name: data.name,
      amount: data.amount,
      reason: data.reason,
      date: data.date,
      isRecurring: data.isRecurring ?? false,
      installments: data.installments,
    });

    this.items.push(deduction);
    return deduction;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindDeductionFilters,
  ): Promise<Deduction[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.isApplied !== undefined) {
      filtered = filtered.filter(
        (item) => item.isApplied === filters.isApplied,
      );
    }
    if (filters?.isRecurring !== undefined) {
      filtered = filtered.filter(
        (item) => item.isRecurring === filters.isRecurring,
      );
    }
    if (filters?.startDate) {
      filtered = filtered.filter((item) => item.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      filtered = filtered.filter((item) => item.date <= filters.endDate!);
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyPending(tenantId: string): Promise<Deduction[]> {
    return this.items
      .filter(
        (item) => item.isPending() && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async findManyPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.isPending() &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async findPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]> {
    return this.findManyPendingByEmployee(employeeId, tenantId);
  }

  async findManyRecurring(tenantId: string): Promise<Deduction[]> {
    return this.items
      .filter(
        (item) => item.isRecurring && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyRecurringByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Deduction[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.isRecurring &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Deduction[]> {
    return this.items
      .filter(
        (item) =>
          item.date >= startDate &&
          item.date <= endDate &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async sumPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.isPending() &&
          item.tenantId.toString() === tenantId,
      )
      .reduce((sum, item) => sum + item.amount, 0);
  }

  async update(data: UpdateDeductionSchema): Promise<Deduction | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const deduction = this.items[index];

    if (data.amount !== undefined) {
      deduction.updateAmount(data.amount);
    }
    if (data.reason !== undefined) {
      deduction.updateReason(data.reason);
    }
    if (data.isApplied === true && data.payrollId) {
      deduction.markAsApplied(data.payrollId);
    } else if (data.isApplied === true) {
      deduction.markAsApplied();
    }

    return deduction;
  }

  async save(deduction: Deduction): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(deduction.id));
    if (index >= 0) {
      this.items[index] = deduction;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
