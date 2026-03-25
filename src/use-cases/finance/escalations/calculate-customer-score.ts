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
  onTimeRate: number;
  lateRate: number;
  veryLateRate: number;
  currentOverdue: number;
  totalEntries: number;
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
        currentOverdue: 0,
        totalEntries: 0,
      };
    }

    const totalEntries = allEntries.length;

    // Paid/received entries (have paymentDate)
    const paidEntries = allEntries.filter(
      (entry) =>
        entry.paymentDate &&
        (entry.status === 'PAID' || entry.status === 'RECEIVED'),
    );

    // Calculate days to payment for paid entries
    let totalDaysToPayment = 0;
    let onTimeCount = 0;
    let lateCount = 0; // 1-30 days late
    let veryLateCount = 0; // 30+ days late

    for (const entry of paidEntries) {
      const daysToPayment = Math.floor(
        (entry.paymentDate!.getTime() - entry.dueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      totalDaysToPayment += daysToPayment;

      if (daysToPayment <= 0) {
        onTimeCount++;
      } else if (daysToPayment <= 30) {
        lateCount++;
      } else {
        veryLateCount++;
      }
    }

    const paidCount = paidEntries.length;
    const avgDaysToPayment =
      paidCount > 0 ? Math.round(totalDaysToPayment / paidCount) : 0;

    // Currently overdue entries (status = OVERDUE)
    const currentOverdue = allEntries.filter(
      (entry) => entry.status === 'OVERDUE',
    ).length;

    // Calculate rates (as percentages)
    const onTimeRate =
      totalEntries > 0 ? Math.round((onTimeCount / totalEntries) * 100) : 100;
    const lateRate =
      totalEntries > 0 ? Math.round((lateCount / totalEntries) * 100) : 0;
    const veryLateRate =
      totalEntries > 0 ? Math.round((veryLateCount / totalEntries) * 100) : 0;

    // Score calculation: 100 - (lateRate * 0.3 + veryLateRate * 0.7 + currentOverdue * 5)
    const rawScore =
      100 - (lateRate * 0.3 + veryLateRate * 0.7 + currentOverdue * 5);
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
      currentOverdue,
      totalEntries,
    };
  }

  private calculateRating(score: number): CustomerPaymentRating {
    if (score >= 80) return 'EXCELLENT';
    if (score >= 60) return 'GOOD';
    if (score >= 40) return 'FAIR';
    return 'POOR';
  }
}
