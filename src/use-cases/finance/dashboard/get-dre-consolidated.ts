import type { FinanceCategory } from '@/entities/finance/finance-category';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type { CompaniesRepository } from '@/repositories/core/companies-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

interface GetConsolidatedDRERequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  companyIds?: string[];
}

export interface ConsolidatedDRENode {
  categoryId: string;
  categoryName: string;
  level: number;
  amount: number;
  children: ConsolidatedDRENode[];
}

export interface CompanyDRESummary {
  companyId: string;
  companyName: string;
  revenue: number;
  expenses: number;
  netResult: number;
  revenueTree: ConsolidatedDRENode;
  expenseTree: ConsolidatedDRENode;
}

export interface ConsolidatedDREResponse {
  companies: CompanyDRESummary[];
  consolidated: {
    revenue: number;
    expenses: number;
    netResult: number;
    revenueTree: ConsolidatedDRENode;
    expenseTree: ConsolidatedDRENode;
  };
  period: { start: Date; end: Date };
}

export class GetConsolidatedDREUseCase {
  constructor(
    private categoriesRepository: FinanceCategoriesRepository,
    private entriesRepository: FinanceEntriesRepository,
    private companiesRepository: CompaniesRepository,
  ) {}

  async execute(
    request: GetConsolidatedDRERequest,
  ): Promise<ConsolidatedDREResponse> {
    const { tenantId, startDate, endDate, companyIds } = request;

    const allCategories = await this.categoriesRepository.findMany(tenantId);

    // Determine target companies
    let targetCompanyIds: string[];
    if (companyIds && companyIds.length > 0) {
      targetCompanyIds = companyIds;
    } else {
      const activeCompanies =
        await this.companiesRepository.findManyActive(tenantId);
      targetCompanyIds = activeCompanies.map((c) => c.id.toString());
    }

    // Get company names
    const companyNameMap = new Map<string, string>();
    for (const companyId of targetCompanyIds) {
      const company = await this.companiesRepository.findById(
        new UniqueEntityID(companyId),
        tenantId,
      );
      if (company) {
        companyNameMap.set(companyId, company.tradeName ?? company.legalName);
      }
    }

    // Build DRE per company by fetching entries filtered by companyId
    const companySummaries: CompanyDRESummary[] = [];
    let allPaidEntries: FinanceEntry[] = [];

    for (const companyId of targetCompanyIds) {
      const { entries: companyEntries } = await this.entriesRepository.findMany(
        {
          tenantId,
          competenceDateFrom: startDate,
          competenceDateTo: endDate,
          competenceDateFallbackToIssueDate: true,
          companyId,
          status: undefined,
          limit: 100000,
        },
      );

      const paidStatuses = ['PAID', 'RECEIVED'];
      const paidCompanyEntries = companyEntries.filter((e) =>
        paidStatuses.includes(e.status),
      );

      allPaidEntries = allPaidEntries.concat(paidCompanyEntries);

      const companyAmounts = this.buildCategoryAmountMap(paidCompanyEntries);

      const revenueTree = this.buildTreeForType(
        'REVENUE',
        allCategories,
        companyAmounts,
      );
      const expenseTree = this.buildTreeForType(
        'EXPENSE',
        allCategories,
        companyAmounts,
      );

      companySummaries.push({
        companyId,
        companyName: companyNameMap.get(companyId) ?? 'Empresa',
        revenue: revenueTree.amount,
        expenses: expenseTree.amount,
        netResult: revenueTree.amount - expenseTree.amount,
        revenueTree,
        expenseTree,
      });
    }

    // Build consolidated totals (sum of all companies)
    const consolidatedAmounts = this.buildCategoryAmountMap(allPaidEntries);
    const consolidatedRevenue = this.buildTreeForType(
      'REVENUE',
      allCategories,
      consolidatedAmounts,
    );
    const consolidatedExpenses = this.buildTreeForType(
      'EXPENSE',
      allCategories,
      consolidatedAmounts,
    );

    return {
      companies: companySummaries,
      consolidated: {
        revenue: consolidatedRevenue.amount,
        expenses: consolidatedExpenses.amount,
        netResult: consolidatedRevenue.amount - consolidatedExpenses.amount,
        revenueTree: consolidatedRevenue,
        expenseTree: consolidatedExpenses,
      },
      period: { start: startDate, end: endDate },
    };
  }

  private buildTreeForType(
    type: 'REVENUE' | 'EXPENSE',
    allCategories: FinanceCategory[],
    amounts: Map<string, number>,
  ): ConsolidatedDRENode {
    const label = type === 'REVENUE' ? 'Receitas' : 'Despesas';
    const nodeId = type === 'REVENUE' ? 'revenue' : 'expenses';

    const relevantCategories = allCategories.filter(
      (c) => c.type === type || c.type === 'BOTH',
    );

    return this.buildDRENode(
      nodeId,
      label,
      relevantCategories,
      allCategories,
      amounts,
      0,
    );
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
    amounts: Map<string, number>,
    level: number,
  ): ConsolidatedDRENode {
    const rootCategories = relevantCategories.filter((c) => !c.parentId);

    const children = rootCategories.map((cat) =>
      this.buildCategoryNode(cat, allCategories, amounts, level + 1),
    );

    const amount = children.reduce((sum, c) => sum + c.amount, 0);

    return {
      categoryId: nodeId,
      categoryName: nodeName,
      level,
      amount,
      children,
    };
  }

  private buildCategoryNode(
    category: FinanceCategory,
    allCategories: FinanceCategory[],
    amounts: Map<string, number>,
    level: number,
  ): ConsolidatedDRENode {
    const catId = category.id.toString();

    const childCategories = allCategories.filter(
      (c) => c.parentId?.toString() === catId,
    );

    const children = childCategories.map((child) =>
      this.buildCategoryNode(child, allCategories, amounts, level + 1),
    );

    const ownAmount = amounts.get(catId) ?? 0;
    const amount = ownAmount + children.reduce((sum, c) => sum + c.amount, 0);

    return {
      categoryId: catId,
      categoryName: category.name,
      level,
      amount,
      children,
    };
  }
}
