import type { FinanceEntry } from '@/entities/finance/finance-entry';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface DetectDuplicateEntryUseCaseRequest {
  tenantId: string;
  supplierName?: string;
  customerName?: string;
  expectedAmount: number;
  dueDate: string; // ISO date string (YYYY-MM-DD)
  description?: string;
}

interface DuplicateMatch {
  entryId: string;
  description: string;
  supplierName?: string;
  customerName?: string;
  expectedAmount: number;
  dueDate: string;
  score: number;
  matchReasons: string[];
}

interface DetectDuplicateEntryUseCaseResponse {
  duplicates: DuplicateMatch[];
}

const MINIMUM_SCORE_THRESHOLD = 70;
const AMOUNT_TOLERANCE_PERCENT = 0.01; // ±1%
const DATE_RANGE_DAYS = 3;

export class DetectDuplicateEntryUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: DetectDuplicateEntryUseCaseRequest,
  ): Promise<DetectDuplicateEntryUseCaseResponse> {
    const {
      tenantId,
      supplierName,
      customerName,
      expectedAmount,
      dueDate,
      description,
    } = request;

    const parsedDueDate = new Date(dueDate);

    // Build date range: ±3 days from the target dueDate
    const dueDateFrom = new Date(parsedDueDate);
    dueDateFrom.setDate(dueDateFrom.getDate() - DATE_RANGE_DAYS);

    const dueDateTo = new Date(parsedDueDate);
    dueDateTo.setDate(dueDateTo.getDate() + DATE_RANGE_DAYS);

    // Build amount range: ±1%
    const amountLow = expectedAmount * (1 - AMOUNT_TOLERANCE_PERCENT);
    const amountHigh = expectedAmount * (1 + AMOUNT_TOLERANCE_PERCENT);

    // Query candidates: entries within date range (the repository findMany
    // filters by dueDateFrom/dueDateTo). We fetch a reasonable batch and
    // then filter by amount in-memory since the repository doesn't expose
    // an amount range filter.
    const { entries: candidateEntries } =
      await this.financeEntriesRepository.findMany({
        tenantId,
        dueDateFrom,
        dueDateTo,
        limit: 200,
      });

    // Filter by amount tolerance
    const amountFilteredEntries = candidateEntries.filter(
      (entry) =>
        entry.expectedAmount >= amountLow && entry.expectedAmount <= amountHigh,
    );

    // Score each candidate
    const scoredDuplicates: DuplicateMatch[] = [];

    for (const entry of amountFilteredEntries) {
      const { score, matchReasons } = this.calculateScore(
        entry,
        expectedAmount,
        parsedDueDate,
        supplierName,
        customerName,
        description,
      );

      if (score >= MINIMUM_SCORE_THRESHOLD) {
        scoredDuplicates.push({
          entryId: entry.id.toString(),
          description: entry.description,
          supplierName: entry.supplierName,
          customerName: entry.customerName,
          expectedAmount: entry.expectedAmount,
          dueDate: entry.dueDate.toISOString().split('T')[0],
          score,
          matchReasons,
        });
      }
    }

    // Sort by score descending
    scoredDuplicates.sort((a, b) => b.score - a.score);

    return { duplicates: scoredDuplicates };
  }

  private calculateScore(
    entry: FinanceEntry,
    targetAmount: number,
    targetDueDate: Date,
    targetSupplierName?: string,
    targetCustomerName?: string,
    _targetDescription?: string,
  ): { score: number; matchReasons: string[] } {
    let score = 0;
    const matchReasons: string[] = [];

    // Exact amount match: +50 points
    if (entry.expectedAmount === targetAmount) {
      score += 50;
      matchReasons.push('Valor exato idêntico');
    }

    // Supplier name match (case-insensitive includes): +30 points
    if (
      targetSupplierName &&
      entry.supplierName &&
      entry.supplierName
        .toLowerCase()
        .includes(targetSupplierName.toLowerCase())
    ) {
      score += 30;
      matchReasons.push('Mesmo fornecedor');
    }

    // Customer name match (case-insensitive includes): +30 points
    if (
      targetCustomerName &&
      entry.customerName &&
      entry.customerName
        .toLowerCase()
        .includes(targetCustomerName.toLowerCase())
    ) {
      score += 30;
      matchReasons.push('Mesmo cliente');
    }

    // Due date proximity scoring
    const daysDiff = Math.abs(
      Math.round(
        (entry.dueDate.getTime() - targetDueDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );

    if (daysDiff <= 1) {
      score += 20;
      matchReasons.push('Vencimento no mesmo dia ou ±1 dia');
    } else if (daysDiff <= 2) {
      score += 10;
      matchReasons.push('Vencimento próximo (±2 dias)');
    } else if (daysDiff <= 3) {
      score += 5;
      matchReasons.push('Vencimento similar (±3 dias)');
    }

    // Description similarity (bonus, not in the original spec but useful): not added to keep it simple

    return { score, matchReasons };
  }
}
