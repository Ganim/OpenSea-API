import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bonus } from '@/entities/hr/bonus';
import type {
  BonusesRepository,
  CreateBonusSchema,
  FindBonusFilters,
  UpdateBonusSchema,
} from '../bonuses-repository';

export class InMemoryBonusesRepository implements BonusesRepository {
  public items: Bonus[] = [];

  async create(data: CreateBonusSchema): Promise<Bonus> {
    const bonus = Bonus.create({
      tenantId: new UniqueEntityID(data.tenantId),
      employeeId: data.employeeId,
      name: data.name,
      amount: data.amount,
      reason: data.reason,
      date: data.date,
    });

    this.items.push(bonus);
    return bonus;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Bonus | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindBonusFilters,
  ): Promise<Bonus[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.isPaid !== undefined) {
      filtered = filtered.filter((item) => item.isPaid === filters.isPaid);
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
  ): Promise<Bonus[]> {
    return this.items
      .filter(
        (item) =>
          item.employeeId.equals(employeeId) &&
          item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyPending(tenantId: string): Promise<Bonus[]> {
    return this.items
      .filter(
        (item) => item.isPending() && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async findManyPendingByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<Bonus[]> {
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
  ): Promise<Bonus[]> {
    return this.findManyPendingByEmployee(employeeId, tenantId);
  }

  async findManyByPeriod(
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<Bonus[]> {
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

  async update(data: UpdateBonusSchema): Promise<Bonus | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const bonus = this.items[index];

    if (data.amount !== undefined) {
      bonus.updateAmount(data.amount);
    }
    if (data.reason !== undefined) {
      bonus.updateReason(data.reason);
    }
    if (data.isPaid === true && data.payrollId) {
      bonus.markAsPaid(data.payrollId);
    } else if (data.isPaid === true) {
      bonus.markAsPaid();
    }

    return bonus;
  }

  async save(bonus: Bonus): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(bonus.id));
    if (index >= 0) {
      this.items[index] = bonus;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
