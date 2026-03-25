import type { FinanceBudget } from '@/entities/finance/finance-budget';
import { financeBudgetPrismaToDomain } from '@/mappers/finance/finance-budget/finance-budget-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import type {
  BudgetActualRow,
  CreateFinanceBudgetSchema,
  FinanceBudgetsRepository,
  FindManyFinanceBudgetsOptions,
  FindManyFinanceBudgetsResult,
  UpdateFinanceBudgetSchema,
} from '../finance-budgets-repository';

export class PrismaFinanceBudgetsRepository
  implements FinanceBudgetsRepository
{
  async create(
    data: CreateFinanceBudgetSchema,
    tx?: TransactionClient,
  ): Promise<FinanceBudget> {
    const db = tx ?? prisma;
    const raw = await db.financeBudget.create({
      data: {
        tenantId: data.tenantId,
        categoryId: data.categoryId,
        costCenterId: data.costCenterId,
        year: data.year,
        month: data.month,
        budgetAmount: data.budgetAmount,
        notes: data.notes,
      },
    });

    return financeBudgetPrismaToDomain(raw);
  }

  async findById(id: string, tenantId: string): Promise<FinanceBudget | null> {
    const raw = await prisma.financeBudget.findFirst({
      where: { id, tenantId },
    });

    if (!raw) return null;
    return financeBudgetPrismaToDomain(raw);
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

    const where = {
      tenantId,
      ...(year !== undefined && { year }),
      ...(categoryId && { categoryId }),
      ...(costCenterId && { costCenterId }),
    };

    const [budgets, total] = await Promise.all([
      prisma.financeBudget.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      }),
      prisma.financeBudget.count({ where }),
    ]);

    return {
      budgets: budgets.map(financeBudgetPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateFinanceBudgetSchema): Promise<FinanceBudget | null> {
    const existing = await prisma.financeBudget.findFirst({
      where: { id: data.id, tenantId: data.tenantId },
    });

    if (!existing) return null;

    const updateData: Record<string, unknown> = {};
    if (data.budgetAmount !== undefined)
      updateData.budgetAmount = data.budgetAmount;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const raw = await prisma.financeBudget.update({
      where: { id: data.id },
      data: updateData,
    });

    return financeBudgetPrismaToDomain(raw);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await prisma.financeBudget.deleteMany({
      where: { id, tenantId },
    });
  }

  async upsert(
    data: CreateFinanceBudgetSchema,
    tx?: TransactionClient,
  ): Promise<FinanceBudget> {
    const db = tx ?? prisma;

    const existing = await db.financeBudget.findFirst({
      where: {
        tenantId: data.tenantId,
        categoryId: data.categoryId,
        costCenterId: data.costCenterId ?? null,
        year: data.year,
        month: data.month,
      },
    });

    if (existing) {
      const raw = await db.financeBudget.update({
        where: { id: existing.id },
        data: {
          budgetAmount: data.budgetAmount,
          notes: data.notes,
        },
      });
      return financeBudgetPrismaToDomain(raw);
    }

    return this.create(data, tx);
  }

  async getBudgetVsActual(
    tenantId: string,
    year: number,
    month: number,
    costCenterId?: string,
  ): Promise<BudgetActualRow[]> {
    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

    const budgetWhere = {
      tenantId,
      year,
      month,
      ...(costCenterId && { costCenterId }),
    };

    const budgets = await prisma.financeBudget.findMany({
      where: budgetWhere,
      include: {
        category: { select: { id: true, name: true } },
        costCenter: { select: { id: true, name: true } },
      },
    });

    const categoryIds = budgets.map((b) => b.categoryId);

    const entryAggregations = await prisma.financeEntry.groupBy({
      by: ['categoryId', 'costCenterId'],
      where: {
        tenantId,
        categoryId: { in: categoryIds },
        deletedAt: null,
        status: { in: ['PAID', 'RECEIVED'] },
        paymentDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
        ...(costCenterId && { costCenterId }),
      },
      _sum: {
        actualAmount: true,
      },
    });

    const actualByKey = new Map<string, number>();
    for (const agg of entryAggregations) {
      const key = `${agg.categoryId}|${agg.costCenterId ?? ''}`;
      actualByKey.set(key, Number(agg._sum.actualAmount ?? 0));
    }

    return budgets.map((budget) => {
      const key = `${budget.categoryId}|${budget.costCenterId ?? ''}`;
      const budgetAmount = Number(budget.budgetAmount);
      const actualAmount = actualByKey.get(key) ?? 0;
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
        categoryId: budget.categoryId,
        categoryName: budget.category.name,
        costCenterId: budget.costCenterId,
        costCenterName: budget.costCenter?.name ?? null,
        budgetAmount,
        actualAmount,
        variance: Math.round(variance * 100) / 100,
        variancePercent: Math.round(variancePercent * 100) / 100,
        status,
      };
    });
  }
}
