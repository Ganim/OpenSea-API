import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface ApplyIndexationUseCaseRequest {
  tenantId: string;
  referenceDate: Date;
}

interface ApplyIndexationUseCaseResponse {
  adjustedCount: number;
}

/**
 * Provider contract for index-based adjustment rates.
 *
 * When injected, the use case calls getIndex(type, referenceDate) for
 * IPCA/IGPM configs. If the provider throws, the error is propagated —
 * stale indexes must not fall back silently to a placeholder rate.
 *
 * When NOT injected, IPCA/IGPM fall back to config.fixedAdjustmentRate
 * (preserving the legacy offline behavior for tenants that haven't
 * wired a real index provider yet).
 */
export interface IndexRateProvider {
  getIndex(
    indexType: 'IPCA' | 'IGPM',
    referenceDate: Date,
  ): Promise<number>;
}

/**
 * Applies annual inflation indexation to recurring configs.
 *
 * For each active config with indexation enabled:
 * - Checks if the current month matches the adjustmentMonth
 * - Checks if the adjustment was not already applied this year
 * - For FIXED_RATE: multiplies expectedAmount by (1 + fixedAdjustmentRate)
 * - For IPCA/IGPM: calls the injected IndexRateProvider; if the provider
 *   is absent, uses fixedAdjustmentRate as a documented fallback; if the
 *   provider is present but throws, the error is propagated (no silent
 *   placeholder — the tenant's contract depends on the real index).
 * - Logs the adjustment in the config notes.
 */
export class ApplyIndexationUseCase {
  constructor(
    private recurringConfigsRepository: RecurringConfigsRepository,
    private indexRateProvider?: IndexRateProvider,
  ) {}

  async execute(
    request: ApplyIndexationUseCaseRequest,
  ): Promise<ApplyIndexationUseCaseResponse> {
    const { tenantId, referenceDate } = request;

    const currentMonth = referenceDate.getUTCMonth() + 1;
    const currentYear = referenceDate.getUTCFullYear();

    const activeConfigs =
      await this.recurringConfigsRepository.findActiveForGeneration(
        new Date(Date.UTC(currentYear + 1, 0, 1)), // Far future to get all active
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
        config.lastAdjustmentDate.getUTCFullYear() === currentYear
      ) {
        continue;
      }

      let adjustmentRate = 0;
      const isExternalIndex =
        config.indexationType === 'IPCA' || config.indexationType === 'IGPM';

      if (isExternalIndex && this.indexRateProvider) {
        // Real provider is wired — any failure must surface. Silently falling
        // back to the fixed placeholder would silently underpay/overpay rent
        // or contract installments for every tenant that relies on the real
        // index (common in BR leasing contracts).
        adjustmentRate = await this.indexRateProvider.getIndex(
          config.indexationType,
          referenceDate,
        );
      } else {
        adjustmentRate = config.fixedAdjustmentRate ?? 0;
      }

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
