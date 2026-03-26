import { prisma } from '@/lib/prisma';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PaymentTimingSuggestion {
  entryId: string;
  supplierName: string;
  amount: number;
  currentDueDate: string;
  suggestedPayDate: string;
  reason: string;
  savingsAmount: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'EARLY_DISCOUNT' | 'DELAY_SAFE' | 'PENALTY_RISK';
}

interface SuggestPaymentTimingRequest {
  tenantId: string;
  daysAhead?: number;
}

interface SuggestPaymentTimingResponse {
  suggestions: PaymentTimingSuggestion[];
  totalPotentialSavings: number;
  analyzedEntries: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CDI_MONTHLY_RATE = 0.01; // ~1% per month as opportunity cost proxy
const CDI_DAILY_RATE = CDI_MONTHLY_RATE / 30;
const DEFAULT_DAYS_AHEAD = 30;
const MAX_DAYS_AHEAD = 90;

// ─── Use Case ────────────────────────────────────────────────────────────────

export class SuggestPaymentTimingUseCase {
  async execute({
    tenantId,
    daysAhead,
  }: SuggestPaymentTimingRequest): Promise<SuggestPaymentTimingResponse> {
    const days = Math.min(Math.max(1, daysAhead ?? DEFAULT_DAYS_AHEAD), MAX_DAYS_AHEAD);
    const now = new Date();
    const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    // Fetch pending payable entries due in the range
    const entries = await prisma.financeEntry.findMany({
      where: {
        tenantId,
        type: 'PAYABLE',
        status: { in: ['PENDING', 'OVERDUE'] },
        deletedAt: null,
        dueDate: { lte: endDate },
      },
      orderBy: { dueDate: 'asc' },
      take: 100,
    });

    const suggestions: PaymentTimingSuggestion[] = [];

    for (const entry of entries) {
      const amount = Number(entry.expectedAmount);
      const discount = Number(entry.discount);
      const interest = Number(entry.interest);
      const penalty = Number(entry.penalty);
      const dueDate = entry.dueDate;
      const supplierName = entry.supplierName ?? 'Fornecedor';
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const daysUntilDue = Math.floor(
        (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Case 1: Early discount available
      if (discount > 0 && daysUntilDue > 0) {
        const discountAmount = discount;
        const daysEarly = Math.min(daysUntilDue, 5);
        const opportunityCost = amount * CDI_DAILY_RATE * daysEarly;
        const netSavings = discountAmount - opportunityCost;

        if (netSavings > 0) {
          const suggestedDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
          suggestions.push({
            entryId: entry.id,
            supplierName,
            amount,
            currentDueDate: dueDateStr,
            suggestedPayDate: suggestedDate.toISOString().split('T')[0],
            reason: `Pague ${supplierName} antecipadamente e economize R$ ${netSavings.toFixed(2)} (desconto de R$ ${discountAmount.toFixed(2)} menos custo de oportunidade de R$ ${opportunityCost.toFixed(2)})`,
            savingsAmount: Math.round(netSavings * 100) / 100,
            priority: netSavings > 100 ? 'HIGH' : 'MEDIUM',
            type: 'EARLY_DISCOUNT',
          });
          continue;
        }
      }

      // Case 2: Overdue with penalty
      if (daysUntilDue < 0 && (penalty > 0 || interest > 0)) {
        const daysLate = Math.abs(daysUntilDue);
        const dailyInterest = interest > 0 ? (interest / 100) * amount / 30 : 0;
        const totalPenaltyCost = penalty + dailyInterest * daysLate;
        const projectedExtraCost = dailyInterest * 7; // projected cost if delayed 7 more days

        suggestions.push({
          entryId: entry.id,
          supplierName,
          amount,
          currentDueDate: dueDateStr,
          suggestedPayDate: new Date().toISOString().split('T')[0],
          reason: `Priorize ${supplierName} — já acumulou R$ ${totalPenaltyCost.toFixed(2)} em multa/juros (${daysLate} dias de atraso). Cada semana adicional custa R$ ${projectedExtraCost.toFixed(2)}.`,
          savingsAmount: Math.round(projectedExtraCost * 100) / 100,
          priority: 'HIGH',
          type: 'PENALTY_RISK',
        });
        continue;
      }

      // Case 3: No penalty for slight delay — safe to postpone
      if (daysUntilDue > 0 && daysUntilDue <= 10 && penalty === 0 && interest === 0 && discount === 0) {
        const safeDelayDays = 7;
        const opportunitySaved = amount * CDI_DAILY_RATE * safeDelayDays;
        const suggestedDate = new Date(dueDate.getTime() + safeDelayDays * 24 * 60 * 60 * 1000);

        if (opportunitySaved > 1) {
          suggestions.push({
            entryId: entry.id,
            supplierName,
            amount,
            currentDueDate: dueDateStr,
            suggestedPayDate: suggestedDate.toISOString().split('T')[0],
            reason: `Pode postergar ${supplierName} até ${suggestedDate.toLocaleDateString('pt-BR')} sem custo adicional. Economia de oportunidade: R$ ${opportunitySaved.toFixed(2)}.`,
            savingsAmount: Math.round(opportunitySaved * 100) / 100,
            priority: 'LOW',
            type: 'DELAY_SAFE',
          });
        }
      }
    }

    // Sort by priority: HIGH first, then MEDIUM, then LOW
    const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    const totalPotentialSavings = suggestions.reduce(
      (sum, s) => sum + s.savingsAmount,
      0,
    );

    return {
      suggestions,
      totalPotentialSavings: Math.round(totalPotentialSavings * 100) / 100,
      analyzedEntries: entries.length,
    };
  }
}
