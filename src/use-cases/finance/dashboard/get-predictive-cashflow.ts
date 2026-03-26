import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface GetPredictiveCashflowRequest {
  tenantId: string;
  months?: number; // future months to project, default 3
}

export interface ProjectedMonth {
  month: string; // YYYY-MM
  projectedRevenue: number;
  projectedExpenses: number;
  projectedBalance: number; // end of month
  confidence: number; // 0-1 based on data quality
  seasonalIndex: number;
}

export interface DangerZone {
  date: string;
  projectedBalance: number;
  deficit: number;
  suggestion: string; // Portuguese
}

export interface DailyProjection {
  date: string; // YYYY-MM-DD
  balance: number;
  isNegative: boolean;
}

export interface PredictiveCashflowReport {
  currentBalance: number;
  projectedMonths: ProjectedMonth[];
  dangerZones: DangerZone[];
  dailyProjection: DailyProjection[];
  suggestions: string[]; // Portuguese actionable suggestions
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

export class GetPredictiveCashflowUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
  ) {}

  async execute(
    request: GetPredictiveCashflowRequest,
  ): Promise<PredictiveCashflowReport> {
    const { tenantId, months = 3 } = request;

    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth();

    // 1. Gather historical data (12 months back)
    const historicalStart = new Date(
      Date.UTC(currentYear - 1, currentMonth, 1),
    );
    const historicalEnd = new Date(
      Date.UTC(currentYear, currentMonth, 0, 23, 59, 59),
    );

    // Future window
    const futureEnd = new Date(
      Date.UTC(currentYear, currentMonth + months + 1, 0, 23, 59, 59),
    );
    const futureStart = new Date(
      Date.UTC(currentYear, currentMonth + 1, 1),
    );

    const [
      historicalReceivable,
      historicalPayable,
      pendingReceivable,
      pendingPayable,
      bankAccounts,
    ] = await Promise.all([
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'RECEIVABLE',
        historicalStart,
        historicalEnd,
        'month',
      ),
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'PAYABLE',
        historicalStart,
        historicalEnd,
        'month',
      ),
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'RECEIVABLE',
        futureStart,
        futureEnd,
        'month',
      ),
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'PAYABLE',
        futureStart,
        futureEnd,
        'month',
      ),
      this.bankAccountsRepository.findMany(tenantId),
    ]);

    // Current balance from active bank accounts
    const currentBalance = bankAccounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    // Build monthly revenue/expense maps from historical data
    const revenueByMonth = new Map<string, number>();
    const expenseByMonth = new Map<string, number>();

    for (const d of historicalReceivable) {
      const key = d.date.substring(0, 7); // YYYY-MM
      revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + d.total);
    }
    for (const d of historicalPayable) {
      const key = d.date.substring(0, 7);
      expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + d.total);
    }

    // Count months with data
    const allMonthKeys = new Set([
      ...revenueByMonth.keys(),
      ...expenseByMonth.keys(),
    ]);
    const monthsOfData = allMonthKeys.size;

    // Data quality assessment
    const dataQuality = this.assessDataQuality(monthsOfData);

    // 2. Calculate weighted moving averages
    const revenueValues = this.getRecentMonthlyValues(
      revenueByMonth,
      currentYear,
      currentMonth,
      12,
    );
    const expenseValues = this.getRecentMonthlyValues(
      expenseByMonth,
      currentYear,
      currentMonth,
      12,
    );

    const avgRevenue = this.weightedMovingAverage(revenueValues);
    const avgExpense = this.weightedMovingAverage(expenseValues);

    // 3. Calculate seasonal indices
    const revenueSeasonalIndices = this.calculateSeasonalIndices(
      revenueByMonth,
      currentYear,
      currentMonth,
    );
    const expenseSeasonalIndices = this.calculateSeasonalIndices(
      expenseByMonth,
      currentYear,
      currentMonth,
    );

    // Pending entries by future month
    const pendingRevByMonth = new Map<string, number>();
    const pendingExpByMonth = new Map<string, number>();

    for (const d of pendingReceivable) {
      const key = d.date.substring(0, 7);
      pendingRevByMonth.set(key, (pendingRevByMonth.get(key) ?? 0) + d.total);
    }
    for (const d of pendingPayable) {
      const key = d.date.substring(0, 7);
      pendingExpByMonth.set(key, (pendingExpByMonth.get(key) ?? 0) + d.total);
    }

    // 4. Project each future month
    const projectedMonths: ProjectedMonth[] = [];
    let runningBalance = currentBalance;
    const dailyProjection: DailyProjection[] = [];
    const dangerZones: DangerZone[] = [];

    for (let i = 1; i <= months; i++) {
      const projYear =
        currentMonth + i > 11 ? currentYear + 1 : currentYear;
      const projMonth = (currentMonth + i) % 12;
      const monthKey = `${projYear}-${String(projMonth + 1).padStart(2, '0')}`;

      const seasonalRevIdx =
        revenueSeasonalIndices.get(projMonth) ?? 1.0;
      const seasonalExpIdx =
        expenseSeasonalIndices.get(projMonth) ?? 1.0;

      // Pending entries already scheduled + projected from historical pattern
      const pendingRev = pendingRevByMonth.get(monthKey) ?? 0;
      const pendingExp = pendingExpByMonth.get(monthKey) ?? 0;

      // If we have pending entries, use them as base and add historical projection for gap
      const projectedRevenue =
        pendingRev + avgRevenue * seasonalRevIdx * (pendingRev > 0 ? 0.3 : 1.0);
      const projectedExpenses =
        pendingExp + avgExpense * seasonalExpIdx * (pendingExp > 0 ? 0.3 : 1.0);

      runningBalance += projectedRevenue - projectedExpenses;

      // Confidence: decreases with projection distance, improves with data quality
      const baseConfidence =
        dataQuality === 'HIGH' ? 0.85 : dataQuality === 'MEDIUM' ? 0.65 : 0.35;
      const distancePenalty = (i - 1) * 0.1;
      const confidence = Math.max(0.1, baseConfidence - distancePenalty);

      projectedMonths.push({
        month: monthKey,
        projectedRevenue: Math.round(projectedRevenue * 100) / 100,
        projectedExpenses: Math.round(projectedExpenses * 100) / 100,
        projectedBalance: Math.round(runningBalance * 100) / 100,
        confidence: Math.round(confidence * 100) / 100,
        seasonalIndex:
          Math.round(((seasonalRevIdx + seasonalExpIdx) / 2) * 100) / 100,
      });

      // Generate daily projections for this month
      const daysInMonth = new Date(projYear, projMonth + 1, 0).getDate();
      const dailyRevenue = projectedRevenue / daysInMonth;
      const dailyExpense = projectedExpenses / daysInMonth;
      const startBalance =
        i === 1 ? currentBalance : projectedMonths[i - 2].projectedBalance;

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${projYear}-${String(projMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayBalance =
          startBalance + (dailyRevenue - dailyExpense) * day;
        const roundedBalance = Math.round(dayBalance * 100) / 100;

        dailyProjection.push({
          date: dayStr,
          balance: roundedBalance,
          isNegative: roundedBalance < 0,
        });

        // Detect danger zones (balance < 0)
        if (roundedBalance < 0) {
          const existingDanger = dangerZones.find(
            (dz) => dz.date === dayStr,
          );
          if (!existingDanger) {
            dangerZones.push({
              date: dayStr,
              projectedBalance: roundedBalance,
              deficit: Math.abs(roundedBalance),
              suggestion: this.generateDangerSuggestion(
                dayStr,
                Math.abs(roundedBalance),
              ),
            });
          }
        }
      }
    }

    // 5. Generate suggestions
    const suggestions = this.generateSuggestions(
      currentBalance,
      projectedMonths,
      dangerZones,
    );

    return {
      currentBalance: Math.round(currentBalance * 100) / 100,
      projectedMonths,
      dangerZones,
      dailyProjection,
      suggestions,
      dataQuality,
    };
  }

  /**
   * Extracts monthly values from the map for the last N months,
   * ordered from oldest to newest.
   */
  private getRecentMonthlyValues(
    monthlyMap: Map<string, number>,
    currentYear: number,
    currentMonth: number,
    count: number,
  ): number[] {
    const values: number[] = [];
    for (let i = count; i >= 1; i--) {
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const m = ((currentMonth - i) % 12 + 12) % 12;
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      values.push(monthlyMap.get(key) ?? 0);
    }
    return values;
  }

  /**
   * Weighted moving average: last 3 months weight 3x, 4-6 weight 2x, 7-12 weight 1x.
   */
  private weightedMovingAverage(values: number[]): number {
    if (values.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;
    const len = values.length;

    for (let i = 0; i < len; i++) {
      const monthsAgo = len - i; // 12..1 (oldest to newest)
      let weight: number;
      if (monthsAgo <= 3) {
        weight = 3;
      } else if (monthsAgo <= 6) {
        weight = 2;
      } else {
        weight = 1;
      }
      weightedSum += values[i] * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Calculates seasonal index for each month of year.
   * Compares the same month in previous year to the average.
   */
  private calculateSeasonalIndices(
    monthlyMap: Map<string, number>,
    currentYear: number,
    currentMonth: number,
  ): Map<number, number> {
    const indices = new Map<number, number>();

    // Calculate the overall monthly average from all historical data
    const allValues = Array.from(monthlyMap.values());
    const overallAvg =
      allValues.length > 0
        ? allValues.reduce((s, v) => s + v, 0) / allValues.length
        : 0;

    if (overallAvg === 0) return indices;

    // For each month, calculate seasonal index
    for (let m = 0; m < 12; m++) {
      const lastYearKey = `${currentYear - 1}-${String(m + 1).padStart(2, '0')}`;
      const thisYearKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;

      const lastYearVal = monthlyMap.get(lastYearKey) ?? 0;
      const thisYearVal = monthlyMap.get(thisYearKey);

      // Use the most recent available value for this month
      const monthVal =
        thisYearVal !== undefined && m < currentMonth
          ? thisYearVal
          : lastYearVal;

      if (monthVal > 0) {
        indices.set(m, monthVal / overallAvg);
      } else {
        indices.set(m, 1.0);
      }
    }

    return indices;
  }

  private assessDataQuality(monthsOfData: number): 'HIGH' | 'MEDIUM' | 'LOW' {
    if (monthsOfData >= 6) return 'HIGH';
    if (monthsOfData >= 3) return 'MEDIUM';
    return 'LOW';
  }

  private generateDangerSuggestion(date: string, deficit: number): string {
    const [year, month, day] = date.split('-');
    const formattedDate = `${day}/${month}/${year}`;
    const formattedDeficit = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(deficit);

    return `Antecipe recebíveis para cobrir o déficit de ${formattedDeficit} previsto para ${formattedDate}.`;
  }

  private generateSuggestions(
    currentBalance: number,
    projectedMonths: ProjectedMonth[],
    dangerZones: DangerZone[],
  ): string[] {
    const suggestions: string[] = [];
    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(v);

    // Danger zone suggestions
    if (dangerZones.length > 0) {
      const firstDanger = dangerZones[0];
      const [y, m, d] = firstDanger.date.split('-');
      suggestions.push(
        `Atenção: saldo projetado negativo a partir de ${d}/${m}/${y}. Antecipe recebíveis ou reduza despesas para evitar déficit de ${formatCurrency(firstDanger.deficit)}.`,
      );

      const totalDangerDays = dangerZones.length;
      if (totalDangerDays > 5) {
        suggestions.push(
          `O fluxo de caixa apresenta ${totalDangerDays} dias com saldo negativo no período projetado. Considere renegociar prazos de pagamento com fornecedores.`,
        );
      }
    }

    // Surplus suggestions
    const lastMonth = projectedMonths[projectedMonths.length - 1];
    if (lastMonth && lastMonth.projectedBalance > currentBalance * 1.2) {
      suggestions.push(
        `Saldo projetado de ${formatCurrency(lastMonth.projectedBalance)} ao final do período — considere investimentos de curto prazo ou antecipação de pagamentos com desconto.`,
      );
    }

    // Revenue vs expense trend
    const totalRevenue = projectedMonths.reduce(
      (s, m) => s + m.projectedRevenue,
      0,
    );
    const totalExpense = projectedMonths.reduce(
      (s, m) => s + m.projectedExpenses,
      0,
    );

    if (totalExpense > totalRevenue * 1.1) {
      suggestions.push(
        `As despesas projetadas superam as receitas em ${formatCurrency(totalExpense - totalRevenue)}. Revise os compromissos futuros e identifique oportunidades de redução de custos.`,
      );
    }

    if (totalRevenue > totalExpense * 1.5) {
      suggestions.push(
        `Receitas projetadas superam despesas significativamente. Oportunidade para reserva de emergência ou investimentos estratégicos.`,
      );
    }

    // If no suggestions generated, add a neutral one
    if (suggestions.length === 0) {
      suggestions.push(
        `Fluxo de caixa estável para o período projetado. Continue monitorando recebíveis e compromissos futuros.`,
      );
    }

    return suggestions;
  }
}
