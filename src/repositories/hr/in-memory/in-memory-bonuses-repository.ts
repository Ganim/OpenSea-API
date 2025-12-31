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
      employeeId: data.employeeId,
      name: data.name,
      amount: data.amount,
      reason: data.reason,
      date: data.date,
    });

    this.items.push(bonus);
    return bonus;
  }

  async findById(id: UniqueEntityID): Promise<Bonus | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findMany(filters?: FindBonusFilters): Promise<Bonus[]> {
    let filtered = [...this.items];

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

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<Bonus[]> {
    return this.items
      .filter((item) => item.employeeId.equals(employeeId))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async findManyPending(): Promise<Bonus[]> {
    return this.items
      .filter((item) => item.isPending())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async findManyPendingByEmployee(
    employeeId: UniqueEntityID,
  ): Promise<Bonus[]> {
    return this.items
      .filter((item) => item.employeeId.equals(employeeId) && item.isPending())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async findPendingByEmployee(employeeId: UniqueEntityID): Promise<Bonus[]> {
    return this.findManyPendingByEmployee(employeeId);
  }

  async findManyByPeriod(startDate: Date, endDate: Date): Promise<Bonus[]> {
    return this.items
      .filter((item) => item.date >= startDate && item.date <= endDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async sumPendingByEmployee(employeeId: UniqueEntityID): Promise<number> {
    return this.items
      .filter((item) => item.employeeId.equals(employeeId) && item.isPending())
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
