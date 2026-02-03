import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Payroll } from '@/entities/hr/payroll';
import { PayrollStatus } from '@/entities/hr/value-objects';
import type {
  CreatePayrollSchema,
  FindPayrollFilters,
  PayrollsRepository,
  UpdatePayrollSchema,
} from '../payrolls-repository';

export class InMemoryPayrollsRepository implements PayrollsRepository {
  public items: Payroll[] = [];

  async create(data: CreatePayrollSchema): Promise<Payroll> {
    const payroll = Payroll.create({
      tenantId: new UniqueEntityID(data.tenantId),
      referenceMonth: data.referenceMonth,
      referenceYear: data.referenceYear,
      totalGross: data.totalGross ?? 0,
      totalDeductions: data.totalDeductions ?? 0,
      status: PayrollStatus.DRAFT(),
    });

    this.items.push(payroll);
    return payroll;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Payroll | null> {
    return (
      this.items.find(
        (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByPeriod(
    referenceMonth: number,
    referenceYear: number,
    tenantId: string,
  ): Promise<Payroll | null> {
    return (
      this.items.find(
        (item) =>
          item.referenceMonth === referenceMonth &&
          item.referenceYear === referenceYear &&
          item.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindPayrollFilters,
  ): Promise<Payroll[]> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.referenceMonth) {
      filtered = filtered.filter(
        (item) => item.referenceMonth === filters.referenceMonth,
      );
    }
    if (filters?.referenceYear) {
      filtered = filtered.filter(
        (item) => item.referenceYear === filters.referenceYear,
      );
    }
    if (filters?.status) {
      filtered = filtered.filter(
        (item) => item.status.value === filters.status,
      );
    }

    return filtered.sort((a, b) => {
      // Sort by year descending, then by month descending
      if (a.referenceYear !== b.referenceYear) {
        return b.referenceYear - a.referenceYear;
      }
      return b.referenceMonth - a.referenceMonth;
    });
  }

  async findManyByYear(year: number, tenantId: string): Promise<Payroll[]> {
    return this.items
      .filter(
        (item) =>
          item.referenceYear === year && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.referenceMonth - a.referenceMonth);
  }

  async findManyByStatus(status: string, tenantId: string): Promise<Payroll[]> {
    return this.items
      .filter(
        (item) =>
          item.status.value === status && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => {
        if (a.referenceYear !== b.referenceYear) {
          return b.referenceYear - a.referenceYear;
        }
        return b.referenceMonth - a.referenceMonth;
      });
  }

  async update(data: UpdatePayrollSchema): Promise<Payroll | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const payroll = this.items[index];

    // Update would mutate the entity - this is a simplified implementation
    // In real scenario, you'd use proper update methods on the entity

    return payroll;
  }

  async save(payroll: Payroll): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(payroll.id));
    if (index >= 0) {
      this.items[index] = payroll;
    }
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
