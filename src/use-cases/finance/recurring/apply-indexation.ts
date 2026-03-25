import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface ApplyIndexationUseCaseRequest {
  tenantId: string;
  referenceDate: Date;
}

interface ApplyIndexationUseCaseResponse {
  adjustedCount: number;
}

/**
 * Applies annual inflation indexation to recurring configs.
 *
 * For each active config with indexation enabled:
 * - Checks if the current month matches the adjustmentMonth
 * - Checks if the adjustment was not already applied this year
 * - For FIXED_RATE: multiplies expectedAmount by (1 + fixedAdjustmentRate)
 * - For IPCA/IGPM: uses fixedAdjustmentRate as placeholder (real API later)
 * - Logs the adjustment in the config notes
 */
export class ApplyIndexationUseCase {
  constructor(private recurringConfigsRepository: RecurringConfigsRepository) {}

  async execute(
    request: ApplyIndexationUseCaseRequest,
  ): Promise<ApplyIndexationUseCaseResponse> {
    const { tenantId, referenceDate } = request;

    const currentMonth = referenceDate.getMonth() + 1;
    const currentYear = referenceDate.getFullYear();

    const activeConfigs =
      await this.recurringConfigsRepository.findActiveForGeneration(
        new Date(currentYear + 1, 0, 1), // Far future to get all active
        tenantId,
      );

    let adjustedCount = 0;

    for (const config of activeConfigs) {
      if (!config.indexationType || config.indexationType === 'NONE') {
        continue;
      }

      if (config.adjustmentMonth !== currentMonth) {
        continue;
      }

      // Check if already adjusted this year
      if (
        config.lastAdjustmentDate &&
        config.lastAdjustmentDate.getFullYear() === currentYear
      ) {
        continue;
      }

      const adjustmentRate = config.fixedAdjustmentRate ?? 0;
      if (adjustmentRate <= 0) {
        continue;
      }

      const previousAmount = config.expectedAmount;
      const adjustedAmount =
        Math.round(previousAmount * (1 + adjustmentRate) * 100) / 100;

      const indexationLabel =
        config.indexationType === 'FIXED_RATE'
          ? 'Taxa Fixa'
          : config.indexationType;

      const adjustmentNote = `[Reajuste ${indexationLabel} ${currentYear}] Valor anterior: R$ ${previousAmount.toFixed(2)} → Novo valor: R$ ${adjustedAmount.toFixed(2)} (${(adjustmentRate * 100).toFixed(2)}%)`;

      const existingNotes = config.notes ? `${config.notes}\n` : '';

      await this.recurringConfigsRepository.update({
        id: config.id.toString(),
        tenantId,
        expectedAmount: adjustedAmount,
        lastAdjustmentDate: referenceDate,
        notes: `${existingNotes}${adjustmentNote}`,
      });

      adjustedCount++;
    }

    return { adjustedCount };
  }
}
