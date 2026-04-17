import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GetBalanceSheetUseCaseRequest {
  tenantId: string;
  startDate: Date;
  endDate: Date;
}

export interface AccountBalance {
  accountId: string;
  code: string;
  name: string;
  balance: number;
}

interface BalanceSheetSection {
  current: AccountBalance[];
  nonCurrent: AccountBalance[];
  total: number;
}

interface EquitySection {
  items: AccountBalance[];
  total: number;
}

export interface GetBalanceSheetUseCaseResponse {
  period: { start: Date; end: Date };
  assets: BalanceSheetSection;
  liabilities: BalanceSheetSection;
  equity: EquitySection;
  totalLiabilitiesAndEquity: number;
  isBalanced: boolean;
}

export class GetBalanceSheetUseCase {
  constructor(
    private chartOfAccountsRepository: ChartOfAccountsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GetBalanceSheetUseCaseRequest,
  ): Promise<GetBalanceSheetUseCaseResponse> {
    const { tenantId, startDate, endDate } = request;

    const allAccounts = await this.chartOfAccountsRepository.findMany(tenantId);

    // P0-09: balance-sheet aggregates everything currently outstanding
    // (PENDING / PARTIALLY_PAID / OVERDUE / SCHEDULED). Including PAID
    // and CANCELLED used to inflate accounts receivable/payable totals.
    const OPEN_STATUSES = [
      'PENDING',
      'PARTIALLY_PAID',
      'OVERDUE',
      'SCHEDULED',
    ];

    // Aggregate finance entries within the period
    const [receivableSums, payableSums] = await Promise.all([
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'RECEIVABLE',
        startDate,
        endDate,
        'month',
        OPEN_STATUSES,
      ),
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'PAYABLE',
        startDate,
        endDate,
        'month',
        OPEN_STATUSES,
      ),
    ]);

    const totalReceivable = receivableSums.reduce((acc, s) => acc + s.total, 0);
    const totalPayable = payableSums.reduce((acc, s) => acc + s.total, 0);

    // Build balance sheet structure from chart of accounts
    const assetAccounts = allAccounts.filter((a) => a.type === 'ASSET');
    const liabilityAccounts = allAccounts.filter((a) => a.type === 'LIABILITY');
    const equityAccounts = allAccounts.filter((a) => a.type === 'EQUITY');
    // Revenue and expense accounts are used for P&L, not directly in balance sheet
    // but their net effect flows into equity as retained earnings

    // Distribute totals proportionally across leaf accounts
    const assetLeafs = assetAccounts.filter(
      (a) => !allAccounts.some((c) => c.parentId?.equals(a.id)),
    );
    const liabilityLeafs = liabilityAccounts.filter(
      (a) => !allAccounts.some((c) => c.parentId?.equals(a.id)),
    );
    const equityLeafs = equityAccounts.filter(
      (a) => !allAccounts.some((c) => c.parentId?.equals(a.id)),
    );

    // Net profit/loss goes to equity
    const netProfit = totalReceivable - totalPayable;

    // For assets: receivable amounts represent asset increases
    const assetCurrentAccounts = this.buildAccountBalances(
      assetLeafs.filter((a) => a.accountClass === 'CURRENT'),
      totalReceivable,
    );
    const assetNonCurrentAccounts = this.buildAccountBalances(
      assetLeafs.filter((a) => a.accountClass !== 'CURRENT'),
      0,
    );
    const totalAssets =
      assetCurrentAccounts.reduce((acc, a) => acc + a.balance, 0) +
      assetNonCurrentAccounts.reduce((acc, a) => acc + a.balance, 0);

    // For liabilities: payable amounts represent liability increases
    const liabilityCurrentAccounts = this.buildAccountBalances(
      liabilityLeafs.filter((a) => a.accountClass === 'CURRENT'),
      totalPayable,
    );
    const liabilityNonCurrentAccounts = this.buildAccountBalances(
      liabilityLeafs.filter((a) => a.accountClass !== 'CURRENT'),
      0,
    );
    const totalLiabilities =
      liabilityCurrentAccounts.reduce((acc, a) => acc + a.balance, 0) +
      liabilityNonCurrentAccounts.reduce((acc, a) => acc + a.balance, 0);

    // Equity includes net profit
    const equityItems = this.buildAccountBalances(equityLeafs, netProfit);
    const totalEquity = equityItems.reduce((acc, a) => acc + a.balance, 0);

    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;
    const isBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01;

    return {
      period: { start: startDate, end: endDate },
      assets: {
        current: assetCurrentAccounts,
        nonCurrent: assetNonCurrentAccounts,
        total: totalAssets,
      },
      liabilities: {
        current: liabilityCurrentAccounts,
        nonCurrent: liabilityNonCurrentAccounts,
        total: totalLiabilities,
      },
      equity: {
        items: equityItems,
        total: totalEquity,
      },
      totalLiabilitiesAndEquity,
      isBalanced,
    };
  }

  private buildAccountBalances(
    accounts: { id: { toString: () => string }; code: string; name: string }[],
    totalToDistribute: number,
  ): AccountBalance[] {
    if (accounts.length === 0) return [];

    const balancePerAccount =
      accounts.length > 0
        ? Math.round((totalToDistribute / accounts.length) * 100) / 100
        : 0;

    return accounts.map((account) => ({
      accountId: account.id.toString(),
      code: account.code,
      name: account.name,
      balance: balancePerAccount,
    }));
  }
}
