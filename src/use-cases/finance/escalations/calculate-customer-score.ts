import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

type CustomerPaymentRating = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';

interface CalculateCustomerScoreUseCaseRequest {
  tenantId: string;
  customerName: string;
}

interface CalculateCustomerScoreUseCaseResponse {
  customerName: string;
  score: number;
  rating: CustomerPaymentRating;
  avgDaysToPayment: number;
  /**
   * Percentage of total RECEIVABLE value (not count) paid on-time.
   */
  onTimeRate: number;
  /**
   * Percentage of total RECEIVABLE value (not count) paid 1-30 days late.
   */
  lateRate: number;
  /**
   * Percentage of total RECEIVABLE value (not count) paid 30+ days late.
   */
  veryLateRate: number;
  /**
   * Total overdue VALUE still open (sum of expectedAmount of OVERDUE entries).
   */
  currentOverdueValue: number;
  /**
   * Number of RECEIVABLE entries currently in OVERDUE status.
   */
  currentOverdue: number;
  totalEntries: number;
  /**
   * Sum of expectedAmount across all RECEIVABLE entries considered.
   */
  totalValue: number;
}

export class CalculateCustomerScoreUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: CalculateCustomerScoreUseCaseRequest,
  ): Promise<CalculateCustomerScoreUseCaseResponse> {
    const { tenantId, customerName } = request;

    if (!customerName || customerName.trim().length === 0) {
      throw new BadRequestError('Customer name is required');
    }

    // Fetch all RECEIVABLE entries for this customer
    const { entries: allEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        type: 'RECEIVABLE',
        customerName: customerName.trim(),
        limit: 5000,
      });

    if (allEntries.length === 0) {
      return {
        customerName: customerName.trim(),
        score: 100,
        rating: 'EXCELLENT',
        avgDaysToPayment: 0,
        onTimeRate: 100,
        lateRate: 0,
        veryLateRate: 0,
        currentOverdueValue: 0,
        currentOverdue: 0,
        totalEntries: 0,
        totalValue: 0,
      };
    }

    const totalEntries = allEntries.length;
    const totalValue = allEntries.reduce(
      (accumulator, entry) => accumulator + entry.expectedAmount,
      0,
    );

    // Paid/received entries (have paymentDate)
    const paidEntries = allEntries.filter(
      (entry) =>
        entry.paymentDate &&
        (entry.status === 'PAID' || entry.status === 'RECEIVED'),
    );

    // Aggregate BOTH counts (for diagnostics like avgDaysToPayment) AND
    // value-weighted totals (for the score / rates). The score must reflect
    // the business impact: a single R$ 1.000.000 late invoice should weigh
    // more than ten R$ 10,00 on-time invoices.
    let totalDaysToPayment = 0;
    let onTimeValue = 0;
    let lateValue = 0; // 1-30 days late
    let veryLateValue = 0; // 30+ days late

    for (const entry of paidEntries) {
      const daysToPayment = Math.floor(
        (entry.paymentDate!.getTime() - entry.dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalDaysToPayment += daysToPayment;

      if (daysToPayment <= 0) {
        onTimeValue += entry.expectedAmount;
      } else if (daysToPayment <= 30) {
        lateValue += entry.expectedAmount;
      } else {
        veryLateValue += entry.expectedAmount;
      }
    }

    const paidCount = paidEntries.length;
    const avgDaysToPayment =
      paidCount > 0 ? Math.round(totalDaysToPayment / paidCount) : 0;

    // Currently overdue entries (status = OVERDUE)
    const overdueEntries = allEntries.filter(
      (entry) => entry.status === 'OVERDUE',
    );
    const currentOverdue = overdueEntries.length;
    const currentOverdueValue = overdueEntries.reduce(
      (accumulator, entry) => accumulator + entry.expectedAmount,
      0,
    );

    // Rates are percentages of VALUE (not count). This ensures the score
    // reflects the economic weight of each invoice rather than treating a
    // R$ 10.00 invoice the same as a R$ 1.000.000,00 one.
    const onTimeRate =
      totalValue > 0 ? Math.round((onTimeValue / totalValue) * 100) : 100;
    const lateRate =
      totalValue > 0 ? Math.round((lateValue / totalValue) * 100) : 0;
    const veryLateRate =
      totalValue > 0 ? Math.round((veryLateValue / totalValue) * 100) : 0;

    // Score penalises late payments (value-weighted) and currently overdue
    // entries (value-weighted as a fraction of total). We weight overdue
    // stronger than very-late payment because an overdue invoice represents
    // cash-at-risk that has not been received yet.
    const overdueValueRate =
      totalValue > 0 ? (currentOverdueValue / totalValue) * 100 : 0;
    const rawScore =
      100 - (lateRate * 0.3 + veryLateRate * 0.7 + overdueValueRate * 0.9);
    const score = Math.max(0, Math.min(100, Math.round(rawScore)));

    // Rating based on score
    const rating = this.calculateRating(score);

    return {
      customerName: customerName.trim(),
      score,
      rating,
      avgDaysToPayment,
      onTimeRate,
      lateRate,
      veryLateRate,
      currentOverdueValue,
      currentOverdue,
      totalEntries,
      totalValue,
    };
  }

  private calculateRating(score: number): CustomerPaymentRating {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  }
}
