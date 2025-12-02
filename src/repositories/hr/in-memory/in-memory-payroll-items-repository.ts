import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PayrollItem } from '@/entities/hr/payroll-item';
import { PayrollItemType } from '@/entities/hr/value-objects';
import type {
    CreatePayrollItemSchema,
    FindPayrollItemFilters,
    PayrollItemsRepository,
    UpdatePayrollItemSchema,
} from '../payroll-items-repository';

export class InMemoryPayrollItemsRepository implements PayrollItemsRepository {
  public items: PayrollItem[] = [];

  async create(data: CreatePayrollItemSchema): Promise<PayrollItem> {
    const payrollItem = PayrollItem.create({
      payrollId: data.payrollId,
      employeeId: data.employeeId,
      type: PayrollItemType.create(data.type),
      description: data.description,
      amount: data.amount,
      isDeduction: data.isDeduction,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
    });

    this.items.push(payrollItem);
    return payrollItem;
  }

  async createMany(data: CreatePayrollItemSchema[]): Promise<PayrollItem[]> {
    const createdItems: PayrollItem[] = [];

    for (const item of data) {
      const payrollItem = await this.create(item);
      createdItems.push(payrollItem);
    }

    return createdItems;
  }

  async findById(id: UniqueEntityID): Promise<PayrollItem | null> {
    return this.items.find((item) => item.id.equals(id)) ?? null;
  }

  async findMany(filters?: FindPayrollItemFilters): Promise<PayrollItem[]> {
    let filtered = [...this.items];

    if (filters?.payrollId) {
      filtered = filtered.filter((item) =>
        item.payrollId.equals(filters.payrollId!),
      );
    }
    if (filters?.employeeId) {
      filtered = filtered.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.type) {
      filtered = filtered.filter((item) => item.type.value === filters.type);
    }
    if (filters?.isDeduction !== undefined) {
      filtered = filtered.filter(
        (item) => item.isDeduction === filters.isDeduction,
      );
    }

    return filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
  }

  async findManyByPayroll(payrollId: UniqueEntityID): Promise<PayrollItem[]> {
    return this.items
      .filter((item) => item.payrollId.equals(payrollId))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async findManyByEmployee(employeeId: UniqueEntityID): Promise<PayrollItem[]> {
    return this.items
      .filter((item) => item.employeeId.equals(employeeId))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async findManyByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<PayrollItem[]> {
    return this.items
      .filter(
        (item) =>
          item.payrollId.equals(payrollId) &&
          item.employeeId.equals(employeeId),
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async sumByPayroll(
    payrollId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }> {
    const payrollItems = this.items.filter((item) =>
      item.payrollId.equals(payrollId),
    );

    let totalGross = 0;
    let totalDeductions = 0;

    for (const item of payrollItems) {
      if (item.isDeduction) {
        totalDeductions += item.amount;
      } else {
        totalGross += item.amount;
      }
    }

    return { totalGross, totalDeductions };
  }

  async sumByPayrollAndEmployee(
    payrollId: UniqueEntityID,
    employeeId: UniqueEntityID,
  ): Promise<{ totalGross: number; totalDeductions: number }> {
    const employeeItems = this.items.filter(
      (item) =>
        item.payrollId.equals(payrollId) && item.employeeId.equals(employeeId),
    );

    let totalGross = 0;
    let totalDeductions = 0;

    for (const item of employeeItems) {
      if (item.isDeduction) {
        totalDeductions += item.amount;
      } else {
        totalGross += item.amount;
      }
    }

    return { totalGross, totalDeductions };
  }

  async update(data: UpdatePayrollItemSchema): Promise<PayrollItem | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));
    if (index === -1) return null;

    const payrollItem = this.items[index];

    if (data.description !== undefined) {
      payrollItem.updateDescription(data.description);
    }
    if (data.amount !== undefined) {
      payrollItem.updateAmount(data.amount);
    }

    return payrollItem;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }

  async deleteByPayroll(payrollId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((item) => !item.payrollId.equals(payrollId));
  }
}
