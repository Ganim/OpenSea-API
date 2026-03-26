import type {
  FinanceEntriesRepository,
  FindManyFinanceEntriesOptions,
} from '@/repositories/finance/finance-entries-repository';

interface GetSupplierSummaryUseCaseRequest {
  tenantId: string;
  supplierName?: string;
  supplierId?: string;
  customerName?: string;
  customerId?: string;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  count: number;
}

export interface RecentEntrySummary {
  id: string;
  description: string;
  expectedAmount: number;
  dueDate: string;
  status: string;
}

export interface SupplierSummaryResponse {
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
  entryCount: number;
  avgAmount: number;
  firstEntryDate: string | null;
  lastEntryDate: string | null;
  monthlyTrend: MonthlyTrend[];
  recentEntries: RecentEntrySummary[];
}

export class GetSupplierSummaryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: GetSupplierSummaryUseCaseRequest,
  ): Promise<SupplierSummaryResponse> {
    const { tenantId, supplierName, supplierId, customerName, customerId } =
      request;

    if (!supplierName && !supplierId && !customerName && !customerId) {
      return this.emptyResponse();
    }

    // Build filter options based on provided params
    const baseFilter: FindManyFinanceEntriesOptions = {
      tenantId,
      page: 1,
      limit: 500,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };

    if (supplierName) {
      baseFilter.supplierName = supplierName;
    }
    if (customerName) {
      baseFilter.customerName = customerName;
    }

    // Fetch all entries for this supplier/customer
    const { entries: allEntries } =
      await this.financeEntriesRepository.findMany(baseFilter);

    // If IDs are provided, further filter by them
    const filteredEntries = allEntries.filter((entry) => {
      if (supplierId && entry.supplierId !== supplierId) return false;
      if (customerId && entry.customerId !== customerId) return false;
      return true;
    });

    if (filteredEntries.length === 0) {
      return this.emptyResponse();
    }

    const now = new Date();

    // Aggregate totals
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;
    let sumExpectedAmount = 0;

    for (const entry of filteredEntries) {
      sumExpectedAmount += entry.expectedAmount;

      if (entry.status === 'PAID' || entry.status === 'RECEIVED') {
        totalPaid += entry.actualAmount ?? entry.expectedAmount;
      } else if (entry.status === 'OVERDUE') {
        totalOverdue += entry.expectedAmount;
      } else if (entry.status === 'PENDING') {
        if (entry.dueDate < now) {
          totalOverdue += entry.expectedAmount;
        } else {
          totalPending += entry.expectedAmount;
        }
      } else if (entry.status === 'PARTIALLY_PAID') {
        totalPending += entry.remainingBalance;
      }
    }

    const entryCount = filteredEntries.length;
    const avgAmount = entryCount > 0 ? sumExpectedAmount / entryCount : 0;

    // Sort by createdAt to find first/last
    const sortedByDate = [...filteredEntries].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );

    const firstEntryDate = sortedByDate[0].createdAt.toISOString();
    const lastEntryDate =
      sortedByDate[sortedByDate.length - 1].createdAt.toISOString();

    // Monthly trend: last 6 months
    const monthlyTrend = this.computeMonthlyTrend(filteredEntries, now);

    // Recent entries: last 5
    const recentEntries = filteredEntries.slice(0, 5).map((entry) => ({
      id: entry.id.toString(),
      description: entry.description,
      expectedAmount: entry.expectedAmount,
      dueDate: entry.dueDate.toISOString(),
      status: entry.status,
    }));

    return {
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalPending: Math.round(totalPending * 100) / 100,
      totalOverdue: Math.round(totalOverdue * 100) / 100,
      entryCount,
      avgAmount: Math.round(avgAmount * 100) / 100,
      firstEntryDate,
      lastEntryDate,
      monthlyTrend,
      recentEntries,
    };
  }

  private computeMonthlyTrend(
    entries: Array<{
      createdAt: Date;
      expectedAmount: number;
    }>,
    now: Date,
  ): MonthlyTrend[] {
    const monthsMap = new Map<string, { total: number; count: number }>();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsMap.set(monthKey, { total: 0, count: 0 });
    }

    // Aggregate entries into months
    for (const entry of entries) {
      const monthKey = `${entry.createdAt.getFullYear()}-${String(entry.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthsMap.get(monthKey);
      if (existing) {
        existing.total += entry.expectedAmount;
        existing.count += 1;
      }
    }

    return Array.from(monthsMap.entries()).map(([month, data]) => ({
      month,
      total: Math.round(data.total * 100) / 100,
      count: data.count,
    }));
  }

  private emptyResponse(): SupplierSummaryResponse {
    return {
      totalPaid: 0,
      totalPending: 0,
      totalOverdue: 0,
      entryCount: 0,
      avgAmount: 0,
      firstEntryDate: null,
      lastEntryDate: null,
      monthlyTrend: [],
      recentEntries: [],
    };
  }
}
