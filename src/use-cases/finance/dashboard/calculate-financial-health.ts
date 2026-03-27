import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { CashflowSnapshotsRepository } from '@/repositories/finance/cashflow-snapshots-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

// ─── Types ────────────────────────────────────────────────────────────

export type HealthTrend = 'UP' | 'DOWN' | 'STABLE';

export interface HealthDimension {
  name: string;
  score: number;
  maxScore: number;
  details: string;
}

export interface CalculateFinancialHealthRequest {
  tenantId: string;
}

export interface CalculateFinancialHealthResponse {
  score: number;
  dimensions: HealthDimension[];
  tips: string[];
  trend: HealthTrend;
}

// ─── Scoring Helpers ──────────────────────────────────────────────────

function scoreLiquidity(ratio: number): number {
  if (ratio >= 2.0) return 20;
  if (ratio >= 1.5) return 16;
  if (ratio >= 1.0) return 12;
  if (ratio >= 0.5) return 6;
  return 0;
}

function scoreDelinquency(rate: number): number {
  if (rate < 0.05) return 20;
  if (rate < 0.1) return 16;
  if (rate < 0.2) return 12;
  if (rate < 0.35) return 6;
  return 0;
}

function scorePredictability(accuracy: number): number {
  if (accuracy >= 90) return 20;
  if (accuracy >= 80) return 16;
  if (accuracy >= 70) return 12;
  if (accuracy >= 50) return 6;
  return 0;
}

function scoreDiversification(concentration: number): number {
  if (concentration < 0.2) return 20;
  if (concentration < 0.3) return 16;
  if (concentration < 0.4) return 12;
  if (concentration < 0.6) return 6;
  return 0;
}

function scoreGrowth(growthRate: number): number {
  if (growthRate > 0.1) return 20;
  if (growthRate > 0.05) return 16;
  if (growthRate > 0) return 12;
  if (growthRate > -0.1) return 6;
  return 0;
}

// ─── Use Case ─────────────────────────────────────────────────────────

export class CalculateFinancialHealthUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private cashflowSnapshotsRepository: CashflowSnapshotsRepository,
  ) {}

  async execute(
    request: CalculateFinancialHealthRequest,
  ): Promise<CalculateFinancialHealthResponse> {
    const { tenantId } = request;

    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const startOfThisMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const endOfThisMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59),
    );
    const startOfLastMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
    );
    const endOfLastMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0, 23, 59, 59),
    );

    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // ─── Parallel Data Fetching ────────────────────────────────────────

    const [
      bankAccounts,
      receivables30d,
      payables30d,
      overduePayableResult,
      overdueReceivableResult,
      pendingPayableResult,
      pendingReceivableResult,
      cashflowSnapshots,
      paidEntriesLast90d,
      revenueThisMonth,
      revenueLastMonth,
    ] = await Promise.all([
      this.bankAccountsRepository.findMany(tenantId),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        status: 'PENDING',
        dueDateFrom: now,
        dueDateTo: in30Days,
        limit: 1000,
      }),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        status: 'PENDING',
        dueDateFrom: now,
        dueDateTo: in30Days,
        limit: 1000,
      }),
      this.financeEntriesRepository.sumOverdue(tenantId, 'PAYABLE'),
      this.financeEntriesRepository.sumOverdue(tenantId, 'RECEIVABLE'),
      this.financeEntriesRepository.countByStatus(tenantId, 'PAYABLE'),
      this.financeEntriesRepository.countByStatus(tenantId, 'RECEIVABLE'),
      this.cashflowSnapshotsRepository.findByDateRange(
        tenantId,
        thirtyDaysAgo,
        now,
      ),
      this.financeEntriesRepository.findMany({
        tenantId,
        type: 'PAYABLE',
        status: 'PAID',
        dueDateFrom: ninetyDaysAgo,
        dueDateTo: now,
        limit: 5000,
      }),
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'RECEIVABLE',
        startOfThisMonth,
        endOfThisMonth,
        'month',
      ),
      this.financeEntriesRepository.sumByDateRange(
        tenantId,
        'RECEIVABLE',
        startOfLastMonth,
        endOfLastMonth,
        'month',
      ),
    ]);

    // ─── 1. Liquidez (Liquidity) ──────────────────────────────────────

    const cashBalance = bankAccounts
      .filter((a) => a.isActive)
      .reduce((sum, a) => sum + a.currentBalance, 0);

    const receivables30dTotal = receivables30d.entries.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );
    const payables30dTotal = payables30d.entries.reduce(
      (sum, e) => sum + e.expectedAmount,
      0,
    );

    const liquidityRatio =
      payables30dTotal > 0
        ? (cashBalance + receivables30dTotal) / payables30dTotal
        : cashBalance + receivables30dTotal > 0
          ? 2.0
          : 0;

    const liquidityScore = scoreLiquidity(liquidityRatio);
    const liquidityDetails = `Razão de liquidez: ${liquidityRatio.toFixed(2)} (Saldo: R$ ${cashBalance.toFixed(2)}, Recebíveis 30d: R$ ${receivables30dTotal.toFixed(2)}, Pagáveis 30d: R$ ${payables30dTotal.toFixed(2)})`;

    // ─── 2. Inadimplência (Delinquency) ───────────────────────────────

    const overdueCount =
      overduePayableResult.count + overdueReceivableResult.count;
    const pendingPayableCount = Object.values(pendingPayableResult).reduce(
      (sum, count) => sum + count,
      0,
    );
    const pendingReceivableCount = Object.values(
      pendingReceivableResult,
    ).reduce((sum, count) => sum + count, 0);
    const totalPendingCount = pendingPayableCount + pendingReceivableCount;

    const delinquencyRate =
      totalPendingCount > 0 ? overdueCount / totalPendingCount : 0;

    const delinquencyScore = scoreDelinquency(delinquencyRate);
    const delinquencyDetails = `Taxa de inadimplência: ${(delinquencyRate * 100).toFixed(1)}% (${overdueCount} vencidos de ${totalPendingCount} pendentes)`;

    // ─── 3. Previsibilidade (Predictability) ──────────────────────────

    const comparableSnapshots = cashflowSnapshots.filter(
      (snapshot) =>
        snapshot.actualInflow !== null && snapshot.actualOutflow !== null,
    );

    let predictabilityAccuracy: number;

    if (comparableSnapshots.length > 0) {
      let totalError = 0;

      for (const snapshot of comparableSnapshots) {
        const predictedNet =
          snapshot.predictedInflow - snapshot.predictedOutflow;
        const actualNet = snapshot.actualInflow! - snapshot.actualOutflow!;
        const denominator = Math.max(Math.abs(actualNet), 1);
        totalError += Math.abs(predictedNet - actualNet) / denominator;
      }

      const averageError = totalError / comparableSnapshots.length;
      predictabilityAccuracy = Math.max(0, (1 - averageError) * 100);
    } else {
      predictabilityAccuracy = 50; // default when no data
    }

    const predictabilityScore =
      comparableSnapshots.length > 0
        ? scorePredictability(predictabilityAccuracy)
        : 10; // default 10pts when no data

    const predictabilityDetails =
      comparableSnapshots.length > 0
        ? `Acurácia do fluxo de caixa: ${predictabilityAccuracy.toFixed(1)}% (${comparableSnapshots.length} períodos analisados)`
        : 'Sem dados de previsão disponíveis (pontuação padrão aplicada)';

    // ─── 4. Diversificação (Diversification) ──────────────────────────

    const paidEntries = paidEntriesLast90d.entries;
    const supplierTotals = new Map<string, number>();

    for (const entry of paidEntries) {
      const supplierKey = entry.supplierName ?? 'unknown';
      supplierTotals.set(
        supplierKey,
        (supplierTotals.get(supplierKey) ?? 0) +
          (entry.actualAmount ?? entry.expectedAmount),
      );
    }

    const totalPaidAmount = Array.from(supplierTotals.values()).reduce(
      (sum, amount) => sum + amount,
      0,
    );

    let topSupplierConcentration = 0;
    let topSupplierName = '';

    if (totalPaidAmount > 0) {
      for (const [name, amount] of supplierTotals.entries()) {
        const concentration = amount / totalPaidAmount;
        if (concentration > topSupplierConcentration) {
          topSupplierConcentration = concentration;
          topSupplierName = name;
        }
      }
    }

    const diversificationScore = scoreDiversification(topSupplierConcentration);
    const diversificationDetails =
      totalPaidAmount > 0
        ? `Concentração do maior fornecedor (${topSupplierName}): ${(topSupplierConcentration * 100).toFixed(1)}% de R$ ${totalPaidAmount.toFixed(2)} pagos nos últimos 90 dias`
        : 'Sem dados de pagamentos nos últimos 90 dias';

    // ─── 5. Crescimento (Growth) ──────────────────────────────────────

    const thisMonthRevenue = revenueThisMonth.reduce(
      (sum, r) => sum + r.total,
      0,
    );
    const lastMonthRevenue = revenueLastMonth.reduce(
      (sum, r) => sum + r.total,
      0,
    );

    const growthRate =
      (thisMonthRevenue - lastMonthRevenue) / Math.max(lastMonthRevenue, 1);

    const growthScore = scoreGrowth(growthRate);
    const growthDetails = `Receita mês atual: R$ ${thisMonthRevenue.toFixed(2)} vs mês anterior: R$ ${lastMonthRevenue.toFixed(2)} (${growthRate >= 0 ? '+' : ''}${(growthRate * 100).toFixed(1)}%)`;

    // ─── Aggregate ────────────────────────────────────────────────────

    const dimensions: HealthDimension[] = [
      {
        name: 'Liquidez',
        score: liquidityScore,
        maxScore: 20,
        details: liquidityDetails,
      },
      {
        name: 'Inadimplência',
        score: delinquencyScore,
        maxScore: 20,
        details: delinquencyDetails,
      },
      {
        name: 'Previsibilidade',
        score: predictabilityScore,
        maxScore: 20,
        details: predictabilityDetails,
      },
      {
        name: 'Diversificação',
        score: diversificationScore,
        maxScore: 20,
        details: diversificationDetails,
      },
      {
        name: 'Crescimento',
        score: growthScore,
        maxScore: 20,
        details: growthDetails,
      },
    ];

    const totalScore = dimensions.reduce((sum, d) => sum + d.score, 0);

    // ─── Tips ─────────────────────────────────────────────────────────

    const tips: string[] = [];

    if (liquidityScore <= 12) {
      tips.push(
        'Sua liquidez está baixa. Considere antecipar recebíveis ou renegociar prazos com fornecedores para melhorar o fluxo de caixa.',
      );
    }

    if (delinquencyScore <= 12) {
      tips.push(
        'A taxa de inadimplência está elevada. Implemente políticas de cobrança mais rigorosas e revise os prazos de pagamento dos clientes.',
      );
    }

    if (predictabilityScore <= 12) {
      tips.push(
        'A previsibilidade do fluxo de caixa pode ser melhorada. Registre projeções regularmente para aumentar a precisão das estimativas.',
      );
    }

    if (diversificationScore <= 12) {
      tips.push(
        'Existe concentração excessiva em poucos fornecedores. Diversifique a base de fornecedores para reduzir riscos operacionais.',
      );
    }

    if (growthScore <= 12) {
      tips.push(
        'A receita está estagnada ou em queda. Revise sua estratégia comercial e busque novas oportunidades de receita.',
      );
    }

    if (tips.length === 0) {
      tips.push(
        'Excelente! Sua saúde financeira está ótima. Continue monitorando os indicadores para manter o desempenho.',
      );
    }

    // ─── Trend ────────────────────────────────────────────────────────

    let trend: HealthTrend;
    if (growthRate > 0.02 && liquidityRatio >= 1.0) {
      trend = 'UP';
    } else if (growthRate < -0.05 || liquidityRatio < 0.5) {
      trend = 'DOWN';
    } else {
      trend = 'STABLE';
    }

    return {
      score: totalScore,
      dimensions,
      tips,
      trend,
    };
  }
}
