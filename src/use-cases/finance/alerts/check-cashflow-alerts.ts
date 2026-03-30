import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface CheckCashFlowAlertsUseCaseRequest {
  tenantId: string;
}

export type CashFlowAlertType =
  | 'NEGATIVE_BALANCE'
  | 'LOW_BALANCE'
  | 'LARGE_OUTFLOW';

export type CashFlowAlertSeverity = 'WARNING' | 'CRITICAL';

export interface CashFlowAlert {
  type: CashFlowAlertType;
  severity: CashFlowAlertSeverity;
  message: string;
  projectedDate: Date;
  projectedBalance: number;
  bankAccountId?: string;
  bankAccountName?: string;
}

export interface SevenDayProjection {
  totalInflows: number;
  totalOutflows: number;
  projectedBalance: number;
}

export interface CheckCashFlowAlertsUseCaseResponse {
  alerts: CashFlowAlert[];
  nextSevenDays: SevenDayProjection;
}

export class CheckCashFlowAlertsUseCase {
  constructor(
    private bankAccountsRepository: BankAccountsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: CheckCashFlowAlertsUseCaseRequest,
  ): Promise<CheckCashFlowAlertsUseCaseResponse> {
    const { tenantId } = request;

    const bankAccounts = await this.bankAccountsRepository.findMany(tenantId);
    const activeBankAccounts = bankAccounts.filter(
      (account) => account.isActive,
    );

    const currentTotalBalance = activeBankAccounts.reduce(
      (sum, account) => sum + account.currentBalance,
      0,
    );

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Fetch pending payable and receivable entries due in next 7 days
    const [payableResult, receivableResult] = await Promise.all([
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        status: 'PENDING',
        dueDateFrom: now,
        dueDateTo: sevenDaysFromNow,
        page: 1,
        limit: 500,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'PENDING',
        dueDateFrom: now,
        dueDateTo: sevenDaysFromNow,
        page: 1,
        limit: 500,
      }),
    ]);

    const totalOutflows = payableResult.entries.reduce(
      (sum, entry) => sum + entry.expectedAmount,
      0,
    );

    const totalInflows = receivableResult.entries.reduce(
      (sum, entry) => sum + entry.expectedAmount,
      0,
    );

    const projectedBalance = currentTotalBalance + totalInflows - totalOutflows;

    const alerts: CashFlowAlert[] = [];

    // Check daily projections for negative balance
    const dailyProjections = this.buildDailyProjections(
      currentTotalBalance,
      payableResult.entries,
      receivableResult.entries,
      now,
      sevenDaysFromNow,
    );

    for (const dailyProjection of dailyProjections) {
      if (dailyProjection.balance < 0) {
        alerts.push({
          type: 'NEGATIVE_BALANCE',
          severity: 'CRITICAL',
          message: `Saldo projetado ficará negativo em ${this.formatDate(dailyProjection.date)}: R$ ${this.formatCurrency(dailyProjection.balance)}`,
          projectedDate: dailyProjection.date,
          projectedBalance: dailyProjection.balance,
        });
        break; // Only report first occurrence
      }
    }

    // Check if projected balance will be less than 10% of current
    const lowBalanceThreshold = currentTotalBalance * 0.1;

    if (
      projectedBalance > 0 &&
      projectedBalance < lowBalanceThreshold &&
      currentTotalBalance > 0
    ) {
      const lowBalanceDay = dailyProjections.find(
        (projection) => projection.balance < lowBalanceThreshold,
      );

      alerts.push({
        type: 'LOW_BALANCE',
        severity: 'WARNING',
        message: `Saldo cairá para menos de 10% do saldo atual nos próximos 7 dias: R$ ${this.formatCurrency(projectedBalance)}`,
        projectedDate: lowBalanceDay?.date ?? sevenDaysFromNow,
        projectedBalance,
      });
    }

    // Check for large single outflows (> 30% of current balance)
    if (currentTotalBalance > 0) {
      const largeOutflowThreshold = currentTotalBalance * 0.3;

      for (const payableEntry of payableResult.entries) {
        if (payableEntry.expectedAmount > largeOutflowThreshold) {
          alerts.push({
            type: 'LARGE_OUTFLOW',
            severity: 'WARNING',
            message: `Saída de R$ ${this.formatCurrency(payableEntry.expectedAmount)} representa ${Math.round((payableEntry.expectedAmount / currentTotalBalance) * 100)}% do saldo atual (${payableEntry.description})`,
            projectedDate: payableEntry.dueDate,
            projectedBalance: currentTotalBalance - payableEntry.expectedAmount,
            bankAccountId: payableEntry.bankAccountId?.toString(),
          });
        }
      }
    }

    return {
      alerts,
      nextSevenDays: {
        totalInflows: Math.round(totalInflows * 100) / 100,
        totalOutflows: Math.round(totalOutflows * 100) / 100,
        projectedBalance: Math.round(projectedBalance * 100) / 100,
      },
    };
  }

  private buildDailyProjections(
    startingBalance: number,
    payableEntries: Array<{ dueDate: Date; expectedAmount: number }>,
    receivableEntries: Array<{ dueDate: Date; expectedAmount: number }>,
    startDate: Date,
    endDate: Date,
  ): Array<{ date: Date; balance: number }> {
    const projections: Array<{ date: Date; balance: number }> = [];
    let runningBalance = startingBalance;

    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const finalDate = new Date(endDate);
    finalDate.setHours(23, 59, 59, 999);

    while (currentDate <= finalDate) {
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);

      const dailyInflows = receivableEntries
        .filter((entry) => entry.dueDate >= dayStart && entry.dueDate <= dayEnd)
        .reduce((sum, entry) => sum + entry.expectedAmount, 0);

      const dailyOutflows = payableEntries
        .filter((entry) => entry.dueDate >= dayStart && entry.dueDate <= dayEnd)
        .reduce((sum, entry) => sum + entry.expectedAmount, 0);

      runningBalance += dailyInflows - dailyOutflows;

      projections.push({
        date: new Date(currentDate),
        balance: Math.round(runningBalance * 100) / 100,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return projections;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR');
  }

  private formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }
}
