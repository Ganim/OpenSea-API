import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';

interface GetPredictiveCashflowRequest {
  tenantId: string;
  months?: number; // future months to project, default 3
}

export interface ForecastDataPoint {
  date: string; // YYYY-MM-DD
  predicted: number;
  p10: number; // 10th percentile (pessimistic)
  p50: number; // 50th percentile (median)
  p90: number; // 90th percentile (optimistic)
  seasonal: number; // seasonal component value
  trend: number; // trend component value
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

export interface SeasonalAccuracy {
  mape: number; // Mean Absolute Percentage Error (0-100%)
  historicalMonths: number;
}

export interface PredictiveCashflowReport {
  currentBalance: number;
  projectedMonths: ProjectedMonth[];
  dangerZones: DangerZone[];
  dailyProjection: DailyProjection[];
  forecast: ForecastDataPoint[];
  accuracy: SeasonalAccuracy;
  seasonalFactors: Record<number, number>; // month (0-11) -> factor
  suggestions: string[]; // Portuguese actionable suggestions
  dataQuality: 'HIGH' | 'MEDIUM' | 'LOW';
}

/** Z-score multiplier for 10th/90th percentile */
const Z_SCORE_P10_P90 = 1.28;

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

    // 1. Gather historical data (up to 24 months back for better seasonal analysis)
    const historicalStart = new Date(
      Date.UTC(currentYear - 2, currentMonth, 1),
    );
    const historicalEnd = new Date(
      Date.UTC(currentYear, currentMonth, 0, 23, 59, 59),
    );

    // Future window
    const futureEnd = new Date(
      Date.UTC(currentYear, currentMonth + months + 1, 0, 23, 59, 59),
    );
    const futureStart = new Date(Date.UTC(currentYear, currentMonth + 1, 1));

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

    // 2. Build ordered monthly net cashflow values
    const monthlyNetValues = this.getOrderedMonthlyNetValues(
      revenueByMonth,
      expenseByMonth,
      currentYear,
      currentMonth,
      Math.min(monthsOfData, 24),
    );

    const monthlyRevenueValues = this.getRecentMonthlyValues(
      revenueByMonth,
      currentYear,
      currentMonth,
      Math.min(monthsOfData, 24),
    );

    const monthlyExpenseValues = this.getRecentMonthlyValues(
      expenseByMonth,
      currentYear,
      currentMonth,
      Math.min(monthsOfData, 24),
    );

    // 3. Seasonal Decomposition (STL-like simplified)
    const useSeasonalDecomposition = monthsOfData >= 12;

    // Calculate trend via linear regression on net monthly totals
    const trendCoefficients = this.linearRegression(monthlyNetValues);

    // Calculate seasonal factors per month
    const revenueSeasonalFactors = this.calculateSeasonalFactorsSTL(
      revenueByMonth,
      currentYear,
      currentMonth,
      monthsOfData,
    );
    const expenseSeasonalFactors = this.calculateSeasonalFactorsSTL(
      expenseByMonth,
      currentYear,
      currentMonth,
      monthsOfData,
    );

    // Combined seasonal factors for the response
    const combinedSeasonalFactors: Record<number, number> = {};
    for (let m = 0; m < 12; m++) {
      const revFactor = revenueSeasonalFactors.get(m) ?? 1.0;
      const expFactor = expenseSeasonalFactors.get(m) ?? 1.0;
      combinedSeasonalFactors[m] =
        Math.round(((revFactor + expFactor) / 2) * 1000) / 1000;
    }

    // Calculate residual standard deviation for confidence intervals
    const residualStdDev = useSeasonalDecomposition
      ? this.calculateResidualStdDev(
          monthlyNetValues,
          trendCoefficients,
          revenueSeasonalFactors,
          expenseSeasonalFactors,
          monthlyRevenueValues,
          monthlyExpenseValues,
          currentYear,
          currentMonth,
          monthsOfData,
        )
      : this.simpleStdDev(monthlyNetValues);

    // 4. Calculate MAPE against last 3 months
    const accuracy = this.calculateMAPE(
      revenueByMonth,
      expenseByMonth,
      trendCoefficients,
      revenueSeasonalFactors,
      expenseSeasonalFactors,
      currentYear,
      currentMonth,
      monthsOfData,
      useSeasonalDecomposition,
    );

    // Weighted moving averages (fallback for non-seasonal)
    const avgRevenue = this.weightedMovingAverage(monthlyRevenueValues);
    const avgExpense = this.weightedMovingAverage(monthlyExpenseValues);

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

    // 5. Project each future month
    const projectedMonths: ProjectedMonth[] = [];
    let runningBalance = currentBalance;
    const dailyProjection: DailyProjection[] = [];
    const dangerZones: DangerZone[] = [];
    const forecast: ForecastDataPoint[] = [];

    for (let i = 1; i <= months; i++) {
      const projYear = currentMonth + i > 11 ? currentYear + 1 : currentYear;
      const projMonth = (currentMonth + i) % 12;
      const monthKey = `${projYear}-${String(projMonth + 1).padStart(2, '0')}`;

      const seasonalRevIdx = revenueSeasonalFactors.get(projMonth) ?? 1.0;
      const seasonalExpIdx = expenseSeasonalFactors.get(projMonth) ?? 1.0;

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

      // Generate daily projections and forecast data points for this month
      const daysInMonth = new Date(projYear, projMonth + 1, 0).getDate();
      const dailyRevenue = projectedRevenue / daysInMonth;
      const dailyExpense = projectedExpenses / daysInMonth;
      const startBalance =
        i === 1 ? currentBalance : projectedMonths[i - 2].projectedBalance;

      const dailyNetPredicted = dailyRevenue - dailyExpense;
      const monthlySeasonalComponent =
        projectedRevenue * (seasonalRevIdx - 1.0) -
        projectedExpenses * (seasonalExpIdx - 1.0);
      const dailySeasonalComponent = monthlySeasonalComponent / daysInMonth;

      // Trend component for this month's position in sequence
      const trendIndexOffset = monthsOfData + i - 1;
      const trendValueForMonth =
        trendCoefficients.slope * trendIndexOffset +
        trendCoefficients.intercept;
      const dailyTrendComponent = trendValueForMonth / daysInMonth;

      // Scale stdDev for daily resolution
      const dailyStdDev = residualStdDev / Math.sqrt(daysInMonth);

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${projYear}-${String(projMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayBalance = startBalance + (dailyRevenue - dailyExpense) * day;
        const roundedBalance = Math.round(dayBalance * 100) / 100;

        dailyProjection.push({
          date: dayStr,
          balance: roundedBalance,
          isNegative: roundedBalance < 0,
        });

        // Build forecast data point with confidence intervals
        const predictedDailyNet = dailyNetPredicted * day;
        const cumulativePredicted = startBalance + predictedDailyNet;

        // Uncertainty grows with sqrt of days
        const dayUncertainty = dailyStdDev * Math.sqrt(day);

        forecast.push({
          date: dayStr,
          predicted: Math.round(cumulativePredicted * 100) / 100,
          p10:
            Math.round(
              (cumulativePredicted - Z_SCORE_P10_P90 * dayUncertainty) * 100,
            ) / 100,
          p50: Math.round(cumulativePredicted * 100) / 100,
          p90:
            Math.round(
              (cumulativePredicted + Z_SCORE_P10_P90 * dayUncertainty) * 100,
            ) / 100,
          seasonal: Math.round(dailySeasonalComponent * day * 100) / 100,
          trend: Math.round(dailyTrendComponent * day * 100) / 100,
        });

        // Detect danger zones (P50 balance < 0)
        if (roundedBalance < 0) {
          const existingDanger = dangerZones.find((dz) => dz.date === dayStr);
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

    // 6. Generate suggestions (enhanced with seasonal insights)
    const suggestions = this.generateSuggestions(
      currentBalance,
      projectedMonths,
      dangerZones,
      combinedSeasonalFactors,
      useSeasonalDecomposition,
    );

    return {
      currentBalance: Math.round(currentBalance * 100) / 100,
      projectedMonths,
      dangerZones,
      dailyProjection,
      forecast,
      accuracy,
      seasonalFactors: combinedSeasonalFactors,
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
      const m = (((currentMonth - i) % 12) + 12) % 12;
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      values.push(monthlyMap.get(key) ?? 0);
    }
    return values;
  }

  /**
   * Gets ordered monthly net values (revenue - expenses) for trend analysis.
   */
  private getOrderedMonthlyNetValues(
    revenueMap: Map<string, number>,
    expenseMap: Map<string, number>,
    currentYear: number,
    currentMonth: number,
    count: number,
  ): number[] {
    const netValues: number[] = [];
    for (let i = count; i >= 1; i--) {
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const m = (((currentMonth - i) % 12) + 12) % 12;
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      const revenue = revenueMap.get(key) ?? 0;
      const expense = expenseMap.get(key) ?? 0;
      netValues.push(revenue - expense);
    }
    return netValues;
  }

  /**
   * Simple linear regression: y = slope * x + intercept.
   */
  private linearRegression(values: number[]): {
    slope: number;
    intercept: number;
  } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: values[0] ?? 0 };

    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return { slope: 0, intercept: sumY / n };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  /**
   * Weighted moving average: last 3 months weight 3x, 4-6 weight 2x, 7-24 weight 1x.
   */
  private weightedMovingAverage(values: number[]): number {
    if (values.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;
    const len = values.length;

    for (let i = 0; i < len; i++) {
      const monthsAgo = len - i; // oldest to newest
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
   * STL-like seasonal factor calculation.
   * With >= 24 months: average of 2 years for each month.
   * With >= 12 months: single year comparison.
   * With < 12 months: returns all 1.0 (no seasonal adjustment).
   */
  private calculateSeasonalFactorsSTL(
    monthlyMap: Map<string, number>,
    currentYear: number,
    currentMonth: number,
    monthsOfData: number,
  ): Map<number, number> {
    const indices = new Map<number, number>();

    if (monthsOfData < 12) {
      // Not enough data for seasonal analysis — fallback to flat
      for (let m = 0; m < 12; m++) {
        indices.set(m, 1.0);
      }
      return indices;
    }

    // Calculate the overall monthly average from all historical data
    const allValues = Array.from(monthlyMap.values());
    const overallAvg =
      allValues.length > 0
        ? allValues.reduce((s, v) => s + v, 0) / allValues.length
        : 0;

    if (overallAvg === 0) {
      for (let m = 0; m < 12; m++) {
        indices.set(m, 1.0);
      }
      return indices;
    }

    const hasTwoYearsOfData = monthsOfData >= 24;

    for (let m = 0; m < 12; m++) {
      const valuesForMonth: number[] = [];

      // Current year value (if month already passed)
      const thisYearKey = `${currentYear}-${String(m + 1).padStart(2, '0')}`;
      if (m < currentMonth && monthlyMap.has(thisYearKey)) {
        valuesForMonth.push(monthlyMap.get(thisYearKey)!);
      }

      // Last year value
      const lastYearKey = `${currentYear - 1}-${String(m + 1).padStart(2, '0')}`;
      if (monthlyMap.has(lastYearKey)) {
        valuesForMonth.push(monthlyMap.get(lastYearKey)!);
      }

      // Two years ago (if available)
      if (hasTwoYearsOfData) {
        const twoYearsAgoKey = `${currentYear - 2}-${String(m + 1).padStart(2, '0')}`;
        if (monthlyMap.has(twoYearsAgoKey)) {
          valuesForMonth.push(monthlyMap.get(twoYearsAgoKey)!);
        }
      }

      if (valuesForMonth.length > 0) {
        const avgForMonth =
          valuesForMonth.reduce((s, v) => s + v, 0) / valuesForMonth.length;
        indices.set(m, avgForMonth / overallAvg);
      } else {
        indices.set(m, 1.0);
      }
    }

    return indices;
  }

  /**
   * Calculates the residual standard deviation after removing trend and seasonal components.
   * Used for confidence intervals (P10/P90).
   */
  private calculateResidualStdDev(
    netValues: number[],
    trend: { slope: number; intercept: number },
    revenueSeasonalFactors: Map<number, number>,
    expenseSeasonalFactors: Map<number, number>,
    revenueValues: number[],
    expenseValues: number[],
    currentYear: number,
    currentMonth: number,
    monthsOfData: number,
  ): number {
    if (netValues.length < 3) return this.simpleStdDev(netValues);

    const residuals: number[] = [];
    const n = netValues.length;

    for (let i = 0; i < n; i++) {
      const monthsAgo = n - i;
      const calendarMonth = (((currentMonth - monthsAgo) % 12) + 12) % 12;

      const trendValue = trend.slope * i + trend.intercept;
      const revSeasonal = revenueSeasonalFactors.get(calendarMonth) ?? 1.0;
      const expSeasonal = expenseSeasonalFactors.get(calendarMonth) ?? 1.0;

      // Predicted = trend * combined seasonal effect
      // For net, the seasonal effect is approximated
      const avgRev =
        revenueValues.length > 0
          ? revenueValues.reduce((s, v) => s + v, 0) / revenueValues.length
          : 0;
      const avgExp =
        expenseValues.length > 0
          ? expenseValues.reduce((s, v) => s + v, 0) / expenseValues.length
          : 0;

      const predictedNet =
        avgRev * revSeasonal -
        avgExp * expSeasonal +
        (trendValue - (avgRev - avgExp));

      const residual = netValues[i] - predictedNet;
      residuals.push(residual);
    }

    return this.simpleStdDev(residuals);
  }

  /**
   * Simple standard deviation calculation.
   */
  private simpleStdDev(values: number[]): number {
    if (values.length < 2) return 0;
    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const squaredDiffs = values.map((v) => (v - mean) ** 2);
    const variance =
      squaredDiffs.reduce((s, v) => s + v, 0) / (values.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculates Mean Absolute Percentage Error (MAPE) by back-testing
   * the model against the last 3 months of actual data.
   */
  private calculateMAPE(
    revenueMap: Map<string, number>,
    expenseMap: Map<string, number>,
    trend: { slope: number; intercept: number },
    revenueSeasonalFactors: Map<number, number>,
    expenseSeasonalFactors: Map<number, number>,
    currentYear: number,
    currentMonth: number,
    monthsOfData: number,
    useSeasonalDecomposition: boolean,
  ): SeasonalAccuracy {
    const testMonths = Math.min(3, monthsOfData);
    if (testMonths === 0) {
      return { mape: 100, historicalMonths: 0 };
    }

    let totalPercentageError = 0;
    let validMonths = 0;

    for (let i = testMonths; i >= 1; i--) {
      const y = currentMonth - i < 0 ? currentYear - 1 : currentYear;
      const m = (((currentMonth - i) % 12) + 12) % 12;
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;

      const actualRevenue = revenueMap.get(key) ?? 0;
      const actualExpense = expenseMap.get(key) ?? 0;
      const actualNet = actualRevenue - actualExpense;

      if (actualNet === 0) continue;

      let predictedNet: number;
      if (useSeasonalDecomposition) {
        const revFactor = revenueSeasonalFactors.get(m) ?? 1.0;
        const expFactor = expenseSeasonalFactors.get(m) ?? 1.0;
        // Use trend position for this month
        const trendIdx = monthsOfData - i;
        const trendValue = trend.slope * trendIdx + trend.intercept;
        // Blend trend with seasonal
        predictedNet = trendValue * ((revFactor + expFactor) / 2);
      } else {
        // Simple linear projection
        const trendIdx = monthsOfData - i;
        predictedNet = trend.slope * trendIdx + trend.intercept;
      }

      const percentageError =
        Math.abs((actualNet - predictedNet) / actualNet) * 100;
      totalPercentageError += percentageError;
      validMonths++;
    }

    const mape =
      validMonths > 0
        ? Math.round((totalPercentageError / validMonths) * 100) / 100
        : 100;

    return {
      mape: Math.min(mape, 100), // Cap at 100%
      historicalMonths: monthsOfData,
    };
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
    seasonalFactors: Record<number, number>,
    hasSeasonalData: boolean,
  ): string[] {
    const suggestions: string[] = [];
    const formatCurrency = (v: number) =>
      new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(v);

    const monthNames = [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ];

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

    // Seasonal pattern suggestions
    if (hasSeasonalData) {
      // Find months with high seasonal factors (expenses spike)
      for (const [monthNum, factor] of Object.entries(seasonalFactors)) {
        const monthIndex = Number(monthNum);
        if (factor > 1.2) {
          const percentAbove = Math.round((factor - 1) * 100);
          suggestions.push(
            `${monthNames[monthIndex]} historicamente tem despesas ${percentAbove}% maiores que a média. Planeje reservas com antecedência.`,
          );
        }
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
