import type { ChartOfAccountsRepository } from '@/repositories/finance/chart-of-accounts-repository';
import type { JournalEntriesRepository } from '@/repositories/finance/journal-entries-repository';

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

/**
 * Balance Sheet (Balanço Patrimonial) derived from the general ledger.
 *
 * P0-08 fix: the previous implementation distributed receivable/payable
 * totals proportionally across every leaf account, producing numbers that
 * had no relationship to the actual journal. This version reads per-account
 * balances directly from `journalEntriesRepository.getTrialBalance`, the
 * single source of truth once double-entry journals are posted.
 *
 * Retained earnings = net income of the period (revenue − expenses), posted
 * into the first EQUITY leaf (Conselho Federal de Contabilidade, NBC TG 26
 * and NBC TG 03).
 */
export class GetBalanceSheetUseCase {
  constructor(
    private chartOfAccountsRepository: ChartOfAccountsRepository,
    private journalEntriesRepository: JournalEntriesRepository,
  ) {}

  async execute(
    request: GetBalanceSheetUseCaseRequest,
  ): Promise<GetBalanceSheetUseCaseResponse> {
    const { tenantId, startDate, endDate } = request;

    const [allAccounts, trialBalance] = await Promise.all([
      this.chartOfAccountsRepository.findMany(tenantId),
      this.journalEntriesRepository.getTrialBalance(
        tenantId,
        startDate,
        endDate,
      ),
    ]);

    const balancesByAccountId = new Map<string, number>();
    for (const tb of trialBalance) {
      balancesByAccountId.set(tb.id, tb.balance);
    }

    const assetAccounts = allAccounts.filter((a) => a.type === 'ASSET');
    const liabilityAccounts = allAccounts.filter((a) => a.type === 'LIABILITY');
    const equityAccounts = allAccounts.filter((a) => a.type === 'EQUITY');
    const revenueAccounts = allAccounts.filter((a) => a.type === 'REVENUE');
    const expenseAccounts = allAccounts.filter((a) => a.type === 'EXPENSE');

    const isLeaf = (
      account: { id: { equals: (other: { id: unknown }['id']) => boolean } },
      pool: { parentId?: { equals: (other: unknown) => boolean } | null }[],
    ) => !pool.some((c) => c.parentId?.equals(account.id));

    const assetLeafs = assetAccounts.filter((a) => isLeaf(a, allAccounts));
    const liabilityLeafs = liabilityAccounts.filter((a) =>
      isLeaf(a, allAccounts),
    );
    const equityLeafs = equityAccounts.filter((a) => isLeaf(a, allAccounts));

    const sumBalances = (
      accounts: { id: { toString: () => string } }[],
    ): number =>
      accounts.reduce(
        (acc, a) => acc + (balancesByAccountId.get(a.id.toString()) ?? 0),
        0,
      );

    // Period net income: revenues minus expenses. Both nature types are
    // CREDIT vs DEBIT; getTrialBalance already produces `balance` with the
    // correct natural sign, so we can sum directly.
    const totalRevenue = sumBalances(revenueAccounts);
    const totalExpense = sumBalances(expenseAccounts);
    const netIncome = totalRevenue - totalExpense;

    const assetCurrentAccounts = this.buildAccountBalances(
      assetLeafs.filter((a) => a.accountClass === 'CURRENT'),
      balancesByAccountId,
    );
    const assetNonCurrentAccounts = this.buildAccountBalances(
      assetLeafs.filter((a) => a.accountClass !== 'CURRENT'),
      balancesByAccountId,
    );
    const totalAssets =
      assetCurrentAccounts.reduce((acc, a) => acc + a.balance, 0) +
      assetNonCurrentAccounts.reduce((acc, a) => acc + a.balance, 0);

    const liabilityCurrentAccounts = this.buildAccountBalances(
      liabilityLeafs.filter((a) => a.accountClass === 'CURRENT'),
      balancesByAccountId,
    );
    const liabilityNonCurrentAccounts = this.buildAccountBalances(
      liabilityLeafs.filter((a) => a.accountClass !== 'CURRENT'),
      balancesByAccountId,
    );
    const totalLiabilities =
      liabilityCurrentAccounts.reduce((acc, a) => acc + a.balance, 0) +
      liabilityNonCurrentAccounts.reduce((acc, a) => acc + a.balance, 0);

    const equityItems = this.buildEquityWithRetainedEarnings(
      equityLeafs,
      balancesByAccountId,
      netIncome,
    );
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
    balancesByAccountId: Map<string, number>,
  ): AccountBalance[] {
    return accounts.map((account) => ({
      accountId: account.id.toString(),
      code: account.code,
      name: account.name,
      balance: balancesByAccountId.get(account.id.toString()) ?? 0,
    }));
  }

  /**
   * Equity leafs carry their own opening balance (capital social, reservas,
   * etc). The period's net income is added to the first equity leaf as
   * "Lucros/Prejuízos Acumulados" so the balance sheet equation holds
   * without requiring a closing journal entry.
   */
  private buildEquityWithRetainedEarnings(
    accounts: { id: { toString: () => string }; code: string; name: string }[],
    balancesByAccountId: Map<string, number>,
    netIncome: number,
  ): AccountBalance[] {
    const items = this.buildAccountBalances(accounts, balancesByAccountId);

    if (items.length === 0) {
      if (netIncome !== 0) {
        items.push({
          accountId: 'retained-earnings',
          code: '3.9',
          name: 'Lucros/Prejuízos Acumulados',
          balance: netIncome,
        });
      }
      return items;
    }

    items[0] = {
      ...items[0],
      balance:
        Math.round((items[0].balance + netIncome + Number.EPSILON) * 100) / 100,
    };
    return items;
  }
}
