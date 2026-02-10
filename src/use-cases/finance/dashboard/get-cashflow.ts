import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface GetCashflowUseCaseRequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
  groupBy: 'day' | 'week' | 'month';
  bankAccountId?: string;
}

export interface CashflowDataPoint {
  date: string;
  inflow: number;
  outflow: number;
  net: number;
  cumulativeBalance: number;
}

interface GetCashflowUseCaseResponse {
  data: CashflowDataPoint[];
  summary: {
    totalInflow: number;
    totalOutflow: number;
    netFlow: number;
    openingBalance: number;
    closingBalance: number;
  };
}

export class GetCashflowUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
  ) {}

  async execute(request: GetCashflowUseCaseRequest): Promise<GetCashflowUseCaseResponse> {
    const { tenantId, startDate, endDate, groupBy, bankAccountId } = request;

    // Get inflows (RECEIVABLE) and outflows (PAYABLE) grouped by date
    const [inflowData, outflowData, bankAccounts] = await Promise.all([
      this.financeEntriesRepository.sumByDateRange(tenantId, 'RECEIVABLE', startDate, endDate, groupBy),
      this.financeEntriesRepository.sumByDateRange(tenantId, 'PAYABLE', startDate, endDate, groupBy),
      this.bankAccountsRepository.findMany(tenantId),
    ]);

    // Calculate opening balance from active bank accounts
    let openingBalance = bankAccounts
      .filter((a) => {
        if (!a.isActive) return false;
        if (bankAccountId && a.id.toString() !== bankAccountId) return false;
        return true;
      })
      .reduce((sum, a) => sum + a.currentBalance, 0);

    // Merge inflow and outflow data into a unified timeline
    const dateSet = new Set<string>();
    for (const d of inflowData) dateSet.add(d.date);
    for (const d of outflowData) dateSet.add(d.date);

    const inflowMap = new Map(inflowData.map((d) => [d.date, d.total]));
    const outflowMap = new Map(outflowData.map((d) => [d.date, d.total]));

    const sortedDates = Array.from(dateSet).sort();
    let cumulativeBalance = openingBalance;

    const data: CashflowDataPoint[] = sortedDates.map((date) => {
      const inflow = inflowMap.get(date) ?? 0;
      const outflow = outflowMap.get(date) ?? 0;
      const net = inflow - outflow;
      cumulativeBalance += net;

      return {
        date,
        inflow,
        outflow,
        net,
        cumulativeBalance,
      };
    });

    const totalInflow = inflowData.reduce((sum, d) => sum + d.total, 0);
    const totalOutflow = outflowData.reduce((sum, d) => sum + d.total, 0);

    return {
      data,
      summary: {
        totalInflow,
        totalOutflow,
        netFlow: totalInflow - totalOutflow,
        openingBalance,
        closingBalance: cumulativeBalance,
      },
    };
  }
}
