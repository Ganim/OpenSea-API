import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceCategoriesRepository } from '@/repositories/finance/finance-categories-repository';

// ─── Types ────────────────────────────────────────────────────────────

export type AnomalyType =
  | 'EXPENSE_SPIKE'
  | 'PRICE_INCREASE'
  | 'UNUSUAL_FREQUENCY'
  | 'NEW_HIGH_VALUE';

export type AnomalySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Anomaly {
  type: AnomalyType;
  severity: AnomalySeverity;
  entryId?: string;
  categoryName?: string;
  supplierName?: string;
  currentValue: number;
  expectedValue: number;
  deviationPercent: number;
  description: string;
}

export interface AnomalyReport {
  anomalies: Anomaly[];
  analyzedPeriod: { from: string; to: string };
  totalEntriesAnalyzed: number;
  categoriesAnalyzed: number;
}

interface DetectAnomaliesUseCaseRequest {
  tenantId: string;
  months?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  if (values.length < 2) return 0;
  const variance =
    values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function classifySeverity(
  value: number,
  avg: number,
  sd: number,
): AnomalySeverity | null {
  if (sd === 0) return null;
  const zScore = (value - avg) / sd;
  if (zScore >= 3) return 'CRITICAL';
  if (zScore >= 2) return 'HIGH';
  if (zScore >= 1.5) return 'MEDIUM';
  return null;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function pct(current: number, expected: number): number {
  if (expected === 0) return 0;
  return Math.round(((current - expected) / expected) * 100);
}

// ─── Use Case ─────────────────────────────────────────────────────────

export class DetectAnomaliesUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute(
    request: DetectAnomaliesUseCaseRequest,
  ): Promise<AnomalyReport> {
    const { tenantId, months = 6 } = request;
    const anomalies: Anomaly[] = [];

    const now = new Date();
    const from = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, 1),
    );
    const to = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
    );
    const currentMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );

    // Fetch all PAYABLE entries (paid or pending) in the analysis window
    const { entries: allEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        dueDateFrom: from,
        dueDateTo: to,
        page: 1,
        limit: 5000,
      });

    // Build category name map
    const categoryIds = [
      ...new Set(allEntries.map((e) => e.categoryId.toString())),
    ];
    const categoryNameMap = new Map<string, string>();
    for (const catId of categoryIds) {
      const cat = await this.financeCategoriesRepository.findById(
        new UniqueEntityID(catId),
        tenantId,
      );
      if (cat) {
        categoryNameMap.set(catId, cat.name);
      }
    }

    const totalEntriesAnalyzed = allEntries.length;

    // ─── 1. Expense Spike by Category ──────────────────────────────

    const byCategory = new Map<
      string,
      { amounts: number[]; currentMonthEntries: typeof allEntries }
    >();

    for (const entry of allEntries) {
      const catId = entry.categoryId.toString();
      if (!byCategory.has(catId)) {
        byCategory.set(catId, { amounts: [], currentMonthEntries: [] });
      }
      const bucket = byCategory.get(catId)!;
      bucket.amounts.push(entry.expectedAmount);

      if (entry.dueDate >= currentMonthStart) {
        bucket.currentMonthEntries.push(entry);
      }
    }

    for (const [catId, { amounts, currentMonthEntries }] of byCategory) {
      if (amounts.length < 3) continue;

      const avg = mean(amounts);
      const sd = stddev(amounts, avg);
      if (sd === 0) continue;

      const catName = categoryNameMap.get(catId) ?? 'Categoria desconhecida';

      for (const entry of currentMonthEntries) {
        const severity = classifySeverity(entry.expectedAmount, avg, sd);
        if (!severity) continue;

        const deviation = pct(entry.expectedAmount, avg);
        anomalies.push({
          type: 'EXPENSE_SPIKE',
          severity,
          entryId: entry.id.toString(),
          categoryName: catName,
          currentValue: entry.expectedAmount,
          expectedValue: Math.round(avg * 100) / 100,
          deviationPercent: deviation,
          description: `${entry.description ?? catName} ${formatCurrency(entry.expectedAmount)} está ${deviation}% acima da média (${formatCurrency(avg)})`,
        });
      }
    }

    // ─── 2. Supplier Price Increase ────────────────────────────────

    const bySupplier = new Map<
      string,
      { amounts: number[]; currentMonthEntries: typeof allEntries }
    >();

    for (const entry of allEntries) {
      const supplier = entry.supplierName;
      if (!supplier) continue;

      const key = supplier.toLowerCase().trim();
      if (!bySupplier.has(key)) {
        bySupplier.set(key, { amounts: [], currentMonthEntries: [] });
      }
      const bucket = bySupplier.get(key)!;
      bucket.amounts.push(entry.expectedAmount);

      if (entry.dueDate >= currentMonthStart) {
        bucket.currentMonthEntries.push(entry);
      }
    }

    for (const [, { amounts, currentMonthEntries }] of bySupplier) {
      if (amounts.length < 3) continue;

      const historicalAmounts = amounts.slice(0, -currentMonthEntries.length);
      if (historicalAmounts.length < 2) continue;

      const avg = mean(historicalAmounts);
      if (avg === 0) continue;

      for (const entry of currentMonthEntries) {
        const increase = pct(entry.expectedAmount, avg);
        if (increase < 30) continue;

        let severity: AnomalySeverity = 'MEDIUM';
        if (increase >= 100) severity = 'CRITICAL';
        else if (increase >= 60) severity = 'HIGH';

        anomalies.push({
          type: 'PRICE_INCREASE',
          severity,
          entryId: entry.id.toString(),
          supplierName: entry.supplierName,
          currentValue: entry.expectedAmount,
          expectedValue: Math.round(avg * 100) / 100,
          deviationPercent: increase,
          description: `Fornecedor ${entry.supplierName}: ${formatCurrency(entry.expectedAmount)} representa aumento de ${increase}% sobre a média histórica (${formatCurrency(avg)})`,
        });
      }
    }

    // ─── 3. Unusual Frequency ──────────────────────────────────────

    // Count entries per category per month
    const frequencyMap = new Map<string, Map<string, number>>();

    for (const entry of allEntries) {
      const catId = entry.categoryId.toString();
      const monthKey = `${entry.dueDate.getUTCFullYear()}-${String(entry.dueDate.getUTCMonth() + 1).padStart(2, '0')}`;

      if (!frequencyMap.has(catId)) {
        frequencyMap.set(catId, new Map());
      }
      const monthCounts = frequencyMap.get(catId)!;
      monthCounts.set(monthKey, (monthCounts.get(monthKey) ?? 0) + 1);
    }

    const currentMonthKey = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

    for (const [catId, monthCounts] of frequencyMap) {
      const allMonthCounts = Array.from(monthCounts.values());
      if (allMonthCounts.length < 3) continue;

      const currentCount = monthCounts.get(currentMonthKey) ?? 0;
      if (currentCount === 0) continue;

      // Exclude current month from average
      const historicalCounts = Array.from(monthCounts.entries())
        .filter(([key]) => key !== currentMonthKey)
        .map(([, count]) => count);

      if (historicalCounts.length < 2) continue;

      const avgCount = mean(historicalCounts);
      if (avgCount === 0) continue;

      const ratio = currentCount / avgCount;
      if (ratio < 2) continue;

      const catName = categoryNameMap.get(catId) ?? 'Categoria desconhecida';
      const deviationPercent = Math.round((ratio - 1) * 100);

      let severity: AnomalySeverity = 'MEDIUM';
      if (ratio >= 4) severity = 'CRITICAL';
      else if (ratio >= 3) severity = 'HIGH';

      anomalies.push({
        type: 'UNUSUAL_FREQUENCY',
        severity,
        categoryName: catName,
        currentValue: currentCount,
        expectedValue: Math.round(avgCount * 10) / 10,
        deviationPercent,
        description: `Categoria "${catName}": ${currentCount} lançamentos este mês vs média de ${avgCount.toFixed(1)}/mês (${deviationPercent}% acima)`,
      });
    }

    // Sort by severity (CRITICAL first, then HIGH, etc.)
    const severityOrder: Record<AnomalySeverity, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    anomalies.sort(
      (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
    );

    return {
      anomalies,
      analyzedPeriod: {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
      totalEntriesAnalyzed,
      categoriesAnalyzed: byCategory.size,
    };
  }
}
