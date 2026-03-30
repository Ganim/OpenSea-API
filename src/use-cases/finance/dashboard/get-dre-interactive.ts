import type { FinanceCategory } from '@/entities/finance/finance-category';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GetInteractiveDRERequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  categoryId?: string;
}

export interface DRENode {
  categoryId: string;
  categoryName: string;
  level: number;
  currentPeriod: number;
  previousPeriod: number;
  variationPercent: number;
  children: DRENode[];
}

export interface InteractiveDREResponse {
  revenue: DRENode;
  expenses: DRENode;
  netResult: number;
  previousNetResult: number;
  variationPercent: number;
  period: { start: Date; end: Date };
  previousPeriod: { start: Date; end: Date };
}

export class GetInteractiveDREUseCase {
  constructor(
    private categoriesRepository: FinanceCategoriesRepository,
    private entriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GetInteractiveDRERequest,
  ): Promise<InteractiveDREResponse> {
    const { tenantId, startDate, endDate } = request;

    // Calculate previous period (same duration shifted back)
    const durationMs = endDate.getTime() - startDate.getTime();
    const prevEnd = new Date(startDate.getTime() - 1); // 1ms before current start
    const prevStart = new Date(prevEnd.getTime() - durationMs);

    // Get all categories for this tenant
    const allCategories = await this.categoriesRepository.findMany(tenantId);

    // Get entries for current period (accrual accounting: use competenceDate)
    const { entries: currentEntries } = await this.entriesRepository.findMany({
      tenantId,
      competenceDateFrom: startDate,
      competenceDateTo: endDate,
      competenceDateFallbackToIssueDate: true,
      status: undefined,
      limit: 100000,
    });

    // Get entries for previous period (accrual accounting: use competenceDate)
    const { entries: previousEntries } = await this.entriesRepository.findMany({
      tenantId,
      competenceDateFrom: prevStart,
      competenceDateTo: prevEnd,
      competenceDateFallbackToIssueDate: true,
      status: undefined,
      limit: 100000,
    });

    // Filter to only PAID/RECEIVED entries
    const paidStatuses = ['PAID', 'RECEIVED'];
    const currentPaid = currentEntries.filter((e) =>
      paidStatuses.includes(e.status),
    );
    const previousPaid = previousEntries.filter((e) =>
      paidStatuses.includes(e.status),
    );

    // Build category amount maps
    const currentAmounts = this.buildCategoryAmountMap(currentPaid);
    const previousAmounts = this.buildCategoryAmountMap(previousPaid);

    // Build revenue tree (REVENUE categories)
    const revenueCategories = allCategories.filter(
      (c) => c.type === 'REVENUE' || c.type === 'BOTH',
    );
    const revenue = this.buildDRENode(
      'revenue',
      'Receitas',
      revenueCategories,
      allCategories,
      currentAmounts,
      previousAmounts,
      0,
    );

    // Build expenses tree (EXPENSE categories)
    const expenseCategories = allCategories.filter(
      (c) => c.type === 'EXPENSE' || c.type === 'BOTH',
    );
    const expenses = this.buildDRENode(
      'expenses',
      'Despesas',
      expenseCategories,
      allCategories,
      currentAmounts,
      previousAmounts,
      0,
    );

    const netResult = revenue.currentPeriod - expenses.currentPeriod;
    const previousNetResult = revenue.previousPeriod - expenses.previousPeriod;
    const variationPercent = this.calcVariation(netResult, previousNetResult);

    return {
      revenue,
      expenses,
      netResult,
      previousNetResult,
      variationPercent,
      period: { start: startDate, end: endDate },
      previousPeriod: { start: prevStart, end: prevEnd },
    };
  }

  private buildCategoryAmountMap(
    entries: { categoryId: { toString(): string }; expectedAmount: number }[],
  ): Map<string, number> {
    const map = new Map<string, number>();
    for (const entry of entries) {
      const catId = entry.categoryId.toString();
      map.set(catId, (map.get(catId) ?? 0) + entry.expectedAmount);
    }
    return map;
  }

  private buildDRENode(
    nodeId: string,
    nodeName: string,
    relevantCategories: FinanceCategory[],
    allCategories: FinanceCategory[],
    currentAmounts: Map<string, number>,
    previousAmounts: Map<string, number>,
    level: number,
  ): DRENode {
    // Find root categories (no parent or parent not in relevant set)
    const rootCategories = relevantCategories.filter((c) => !c.parentId);

    const children = rootCategories.map((cat) =>
      this.buildCategoryNode(
        cat,
        allCategories,
        currentAmounts,
        previousAmounts,
        level + 1,
      ),
    );

    const currentPeriod = children.reduce((sum, c) => sum + c.currentPeriod, 0);
    const previousPeriod = children.reduce(
      (sum, c) => sum + c.previousPeriod,
      0,
    );

    return {
      categoryId: nodeId,
      categoryName: nodeName,
      level,
      currentPeriod,
      previousPeriod,
      variationPercent: this.calcVariation(currentPeriod, previousPeriod),
      children,
    };
  }

  private buildCategoryNode(
    category: FinanceCategory,
    allCategories: FinanceCategory[],
    currentAmounts: Map<string, number>,
    previousAmounts: Map<string, number>,
    level: number,
  ): DRENode {
    const catId = category.id.toString();

    // Find child categories
    const childCategories = allCategories.filter(
      (c) => c.parentId?.toString() === catId,
    );

    const children = childCategories.map((child) =>
      this.buildCategoryNode(
        child,
        allCategories,
        currentAmounts,
        previousAmounts,
        level + 1,
      ),
    );

    // Own amounts (leaf node amounts)
    const ownCurrent = currentAmounts.get(catId) ?? 0;
    const ownPrevious = previousAmounts.get(catId) ?? 0;

    // Total = own + children
    const currentPeriod =
      ownCurrent + children.reduce((sum, c) => sum + c.currentPeriod, 0);
    const previousPeriod =
      ownPrevious + children.reduce((sum, c) => sum + c.previousPeriod, 0);

    return {
      categoryId: catId,
      categoryName: category.name,
      level,
      currentPeriod,
      previousPeriod,
      variationPercent: this.calcVariation(currentPeriod, previousPeriod),
      children,
    };
  }

  private calcVariation(current: number, previous: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }
    return (
      Math.round(((current - previous) / Math.abs(previous)) * 10000) / 100
    );
  }
}
