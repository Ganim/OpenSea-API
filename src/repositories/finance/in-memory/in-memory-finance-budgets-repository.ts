import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceBudget } from '@/entities/finance/finance-budget';
import type {
  BudgetActualRow,
  CreateFinanceBudgetSchema,
  FinanceBudgetsRepository,
  FindManyFinanceBudgetsOptions,
  FindManyFinanceBudgetsResult,
  UpdateFinanceBudgetSchema,
} from '../finance-budgets-repository';

export class InMemoryFinanceBudgetsRepository
  implements FinanceBudgetsRepository
{
  public items: FinanceBudget[] = [];

  async create(data: CreateFinanceBudgetSchema): Promise<FinanceBudget> {
    const budget = FinanceBudget.create({
      tenantId: new UniqueEntityID(data.tenantId),
      categoryId: new UniqueEntityID(data.categoryId),
      costCenterId: data.costCenterId
        ? new UniqueEntityID(data.costCenterId)
        : undefined,
      year: data.year,
      month: data.month,
      budgetAmount: data.budgetAmount,
      notes: data.notes,
    });

    this.items.push(budget);
    return budget;
  }

  async findById(id: string, tenantId: string): Promise<FinanceBudget | null> {
    return (
      this.items.find(
        (b) => b.id.toString() === id && b.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    options: FindManyFinanceBudgetsOptions,
  ): Promise<FindManyFinanceBudgetsResult> {
    const {
      tenantId,
      year,
      categoryId,
      costCenterId,
      page = 1,
      limit = 20,
    } = options;

    let filtered = this.items.filter((b) => b.tenantId.toString() === tenantId);

    if (year !== undefined) {
      filtered = filtered.filter((b) => b.year === year);
    }
    if (categoryId) {
      filtered = filtered.filter((b) => b.categoryId.toString() === categoryId);
    }
    if (costCenterId) {
      filtered = filtered.filter(
        (b) => b.costCenterId?.toString() === costCenterId,
      );
    }

    const total = filtered.length;
    const start = (page - 1) * limit;
    const budgets = filtered.slice(start, start + limit);

    return { budgets, total };
  }

  async update(data: UpdateFinanceBudgetSchema): Promise<FinanceBudget | null> {
    const index = this.items.findIndex(
      (b) =>
        b.id.toString() === data.id && b.tenantId.toString() === data.tenantId,
    );

    if (index === -1) return null;

    const budget = this.items[index];

    if (data.budgetAmount !== undefined)
      budget.budgetAmount = data.budgetAmount;
    if (data.notes !== undefined) budget.notes = data.notes ?? undefined;

    return budget;
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (b) => b.id.toString() === id && b.tenantId.toString() === tenantId,
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async upsert(data: CreateFinanceBudgetSchema): Promise<FinanceBudget> {
    const existingIndex = this.items.findIndex(
      (b) =>
        b.tenantId.toString() === data.tenantId &&
        b.categoryId.toString() === data.categoryId &&
        (b.costCenterId?.toString() ?? null) === (data.costCenterId ?? null) &&
        b.year === data.year &&
        b.month === data.month,
    );

    if (existingIndex !== -1) {
      this.items[existingIndex].budgetAmount = data.budgetAmount;
      if (data.notes !== undefined)
        this.items[existingIndex].notes = data.notes;
      return this.items[existingIndex];
    }

    return this.create(data);
  }

  async getBudgetVsActual(
    tenantId: string,
    year: number,
    month: number,
    _costCenterId?: string,
  ): Promise<BudgetActualRow[]> {
    const budgetsForPeriod = this.items.filter(
      (b) =>
        b.tenantId.toString() === tenantId &&
        b.year === year &&
        b.month === month,
    );

    return budgetsForPeriod.map((budget) => {
      const budgetAmount = budget.budgetAmount;
      const actualAmount = 0; // In-memory doesn't cross-reference entries
      const variance = actualAmount - budgetAmount;
      const variancePercent =
        budgetAmount !== 0 ? (variance / budgetAmount) * 100 : 0;

      let status: 'UNDER_BUDGET' | 'ON_BUDGET' | 'OVER_BUDGET';
      if (variancePercent > 10) {
        status = 'OVER_BUDGET';
      } else if (variancePercent < -10) {
        status = 'UNDER_BUDGET';
      } else {
        status = 'ON_BUDGET';
      }

      return {
        categoryId: budget.categoryId.toString(),
        categoryName: `Category ${budget.categoryId.toString()}`,
        costCenterId: budget.costCenterId?.toString() ?? null,
        costCenterName: budget.costCenterId
          ? `CostCenter ${budget.costCenterId.toString()}`
          : null,
        budgetAmount,
        actualAmount,
        variance,
        variancePercent,
        status,
      };
    });
  }
}
