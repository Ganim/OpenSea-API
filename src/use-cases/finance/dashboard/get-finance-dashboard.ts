import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type {
  FinanceEntriesRepository,
  OverdueByParty,
} from '@/repositories/finance/finance-entries-repository';

interface GetFinanceDashboardUseCaseRequest {
  tenantId: string;
}

interface GetFinanceDashboardUseCaseResponse {
  totalPayable: number;
  totalReceivable: number;
  overduePayable: number;
  overdueReceivable: number;
  overduePayableCount: number;
  overdueReceivableCount: number;
  paidThisMonth: number;
  receivedThisMonth: number;
  upcomingPayable7Days: number;
  upcomingReceivable7Days: number;
  cashBalance: number;
  statusCounts: Record<string, number>;
  topOverdueReceivables: OverdueByParty[];
  topOverduePayables: OverdueByParty[];
}

export class GetFinanceDashboardUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
  ) {}

  async execute(
    request: GetFinanceDashboardUseCaseRequest,
  ): Promise<GetFinanceDashboardUseCaseResponse> {
    const { tenantId } = request;

    const now = new Date();
    const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const endOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      overduePayableResult,
      overdueReceivableResult,
      totalPayableResult,
      totalReceivableResult,
      paidThisMonthResult,
      receivedThisMonthResult,
      upcomingPayableResult,
      upcomingReceivableResult,
      bankAccounts,
      statusCounts,
      topOverdueReceivables,
      topOverduePayables,
    ] = await Promise.all([
      this.financeEntriesRepository.sumOverdue(tenantId, 'PAYABLE'),
      this.financeEntriesRepository.sumOverdue(tenantId, 'RECEIVABLE'),
      this.financeEntriesRepository.sumByDateRange(tenantId, 'PAYABLE', startOfMonth, endOfMonth, 'month'),
      this.financeEntriesRepository.sumByDateRange(tenantId, 'RECEIVABLE', startOfMonth, endOfMonth, 'month'),
      this.getPaidThisMonth(tenantId, startOfMonth, endOfMonth, 'PAYABLE'),
      this.getPaidThisMonth(tenantId, startOfMonth, endOfMonth, 'RECEIVABLE'),
      this.financeEntriesRepository.sumByDateRange(tenantId, 'PAYABLE', now, in7Days, 'month'),
      this.financeEntriesRepository.sumByDateRange(tenantId, 'RECEIVABLE', now, in7Days, 'month'),
      this.bankAccountsRepository.findMany(tenantId),
      this.financeEntriesRepository.countByStatus(tenantId),
      this.financeEntriesRepository.topOverdueByCustomer(tenantId, 10),
      this.financeEntriesRepository.topOverdueBySupplier(tenantId, 10),
    ]);

    const totalPayable = totalPayableResult.reduce((sum, r) => sum + r.total, 0);
    const totalReceivable = totalReceivableResult.reduce((sum, r) => sum + r.total, 0);
    const upcomingPayable7Days = upcomingPayableResult.reduce((sum, r) => sum + r.total, 0);
    const upcomingReceivable7Days = upcomingReceivableResult.reduce((sum, r) => sum + r.total, 0);

    const cashBalance = bankAccounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    return {
      totalPayable,
      totalReceivable,
      overduePayable: overduePayableResult.total,
      overdueReceivable: overdueReceivableResult.total,
      overduePayableCount: overduePayableResult.count,
      overdueReceivableCount: overdueReceivableResult.count,
      paidThisMonth: paidThisMonthResult,
      receivedThisMonth: receivedThisMonthResult,
      upcomingPayable7Days,
      upcomingReceivable7Days,
      cashBalance,
      statusCounts,
      topOverdueReceivables,
      topOverduePayables,
    };
  }

  private async getPaidThisMonth(
    tenantId: string,
    from: Date,
    to: Date,
    type: string,
  ): Promise<number> {
    // Sum entries that have paymentDate this month
    const result = await this.financeEntriesRepository.findMany({
      tenantId,
      type,
      status: type === 'PAYABLE' ? 'PAID' : 'RECEIVED',
      dueDateFrom: from,
      dueDateTo: to,
      limit: 1000,
    });

    return result.entries.reduce((sum, e) => sum + (e.actualAmount ?? 0), 0);
  }
}
