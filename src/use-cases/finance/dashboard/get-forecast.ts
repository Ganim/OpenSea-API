import type {
  FinanceEntriesRepository,
  DateRangeSum,
  CategorySum,
  CostCenterSum,
} from '@/repositories/finance/finance-entries-repository';

interface GetForecastUseCaseRequest {
  tenantId: string;
  type?: string; // 'PAYABLE' | 'RECEIVABLE'
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
  costCenterId?: string;
  categoryId?: string;
}

export interface ForecastDataPoint {
  date: string;
  payable: number;
  receivable: number;
  net: number;
  cumulativeNet: number;
}

interface GetForecastUseCaseResponse {
  data: ForecastDataPoint[];
  totals: {
    totalPayable: number;
    totalReceivable: number;
    netBalance: number;
  };
  byCategory: CategorySum[];
  byCostCenter: CostCenterSum[];
}

export class GetForecastUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(request: GetForecastUseCaseRequest): Promise<GetForecastUseCaseResponse> {
    const { tenantId, type, startDate, endDate, groupBy, costCenterId, categoryId } = request;

    // If type is specified, only get that type; otherwise get both
    const fetchPayable = !type || type === 'PAYABLE';
    const fetchReceivable = !type || type === 'RECEIVABLE';

    const [payableData, receivableData, byCategory, byCostCenter] = await Promise.all([
      fetchPayable
        ? this.financeEntriesRepository.sumByDateRange(tenantId, 'PAYABLE', startDate, endDate, groupBy)
        : Promise.resolve([] as DateRangeSum[]),
      fetchReceivable
        ? this.financeEntriesRepository.sumByDateRange(tenantId, 'RECEIVABLE', startDate, endDate, groupBy)
        : Promise.resolve([] as DateRangeSum[]),
      this.financeEntriesRepository.sumByCategory(tenantId, type, startDate, endDate),
      this.financeEntriesRepository.sumByCostCenter(tenantId, type, startDate, endDate),
    ]);

    // Merge into unified timeline
    const dateSet = new Set<string>();
    for (const d of payableData) dateSet.add(d.date);
    for (const d of receivableData) dateSet.add(d.date);

    const payableMap = new Map(payableData.map((d) => [d.date, d.total]));
    const receivableMap = new Map(receivableData.map((d) => [d.date, d.total]));

    const sortedDates = Array.from(dateSet).sort();
    let cumulativeNet = 0;

    const data: ForecastDataPoint[] = sortedDates.map((date) => {
      const payable = payableMap.get(date) ?? 0;
      const receivable = receivableMap.get(date) ?? 0;
      const net = receivable - payable;
      cumulativeNet += net;

      return { date, payable, receivable, net, cumulativeNet };
    });

    const totalPayable = payableData.reduce((sum, d) => sum + d.total, 0);
    const totalReceivable = receivableData.reduce((sum, d) => sum + d.total, 0);

    return {
      data,
      totals: {
        totalPayable,
        totalReceivable,
        netBalance: totalReceivable - totalPayable,
      },
      byCategory,
      byCostCenter,
    };
  }
}
