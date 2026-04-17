import type {
  FinanceEntryType,
  RecurrenceUnit,
} from '@/entities/finance/finance-entry-types';
import type { RecurringConfig } from '@/entities/finance/recurring-config';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';
import { getNextBusinessDay } from '@/utils/brazilian-holidays';
import { calculateNextDate } from '@/utils/finance/calculate-next-date';

const NEAR_EXPIRY_DAYS = 30;
const TREND_SAMPLE_SIZE = 3;
// P1-12: cap trend buffer so configs with thousands of generated entries
// (e.g. daily recurring over several years) don't grow `recentAmounts`
// unbounded inside a single batch run. We only need the last few entries
// for the linear trend extrapolation, so keep a rolling window.
const TREND_BUFFER_MAX_SIZE = 30;

interface GenerateRecurringBatchUseCaseRequest {
  tenantId: string;
  endDate: Date;
}

interface GenerateRecurringBatchUseCaseResponse {
  generatedCount: number;
  configsProcessed: number;
  pausedByExpiry: number;
}

/**
 * Computes a linear extrapolation from the last N amounts.
 * Returns the projected next amount and the average delta.
 */
function computeAmountTrend(
  recentAmounts: number[],
): { suggestedAmount: number; averageDelta: number } | null {
  if (recentAmounts.length < TREND_SAMPLE_SIZE) return null;

  const lastEntries = recentAmounts.slice(-TREND_SAMPLE_SIZE);
  const deltas: number[] = [];

  for (let i = 1; i < lastEntries.length; i++) {
    deltas.push(lastEntries[i] - lastEntries[i - 1]);
  }

  const isConsistentTrend =
    deltas.every((d) => d > 0) || deltas.every((d) => d < 0);
  if (!isConsistentTrend) return null;

  const averageDelta =
    Math.round((deltas.reduce((sum, d) => sum + d, 0) / deltas.length) * 100) /
    100;
  const suggestedAmount =
    Math.round((lastEntries[lastEntries.length - 1] + averageDelta) * 100) /
    100;

  return { suggestedAmount, averageDelta };
}

/**
 * Checks if a recurring config is within N days of its endDate.
 */
function isNearExpiry(config: RecurringConfig): boolean {
  if (!config.endDate) return false;
  const now = new Date();
  const daysUntilEnd =
    (config.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilEnd <= NEAR_EXPIRY_DAYS && daysUntilEnd > 0;
}

export class GenerateRecurringBatchUseCase {
  constructor(
    private recurringConfigsRepository: RecurringConfigsRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GenerateRecurringBatchUseCaseRequest,
  ): Promise<GenerateRecurringBatchUseCaseResponse> {
    const { tenantId, endDate } = request;

    const activeConfigs =
      await this.recurringConfigsRepository.findActiveForGeneration(
        endDate,
        tenantId,
      );

    let totalGenerated = 0;
    let pausedByExpiry = 0;

    for (const config of activeConfigs) {
      let currentDueDate = config.nextDueDate;
      if (!currentDueDate) continue;

      let generatedForConfig = 0;

      // Collect recent entry amounts for trend detection (for variable configs)
      const recentAmounts: number[] = [];
      if (config.isVariable && config.generatedCount >= TREND_SAMPLE_SIZE) {
        const { entries } = await this.financeEntriesRepository.findMany({
          tenantId,
          categoryId: config.categoryId.toString(),
          sortBy: 'createdAt',
          sortOrder: 'desc',
          limit: TREND_SAMPLE_SIZE,
        });
        recentAmounts.push(...entries.map((e) => e.expectedAmount).reverse());
      }

      while (currentDueDate <= endDate) {
        // Respect totalOccurrences limit
        if (
          config.totalOccurrences &&
          config.generatedCount + generatedForConfig >= config.totalOccurrences
        ) {
          break;
        }

        // Respect endDate on the config itself
        if (config.endDate && currentDueDate > config.endDate) {
          break;
        }

        const installmentNumber =
          config.generatedCount + generatedForConfig + 1;

        // Holiday awareness: adjust dueDate to next business day
        const adjustedDueDate = getNextBusinessDay(new Date(currentDueDate));

        // Trend detection for variable entries
        const trend = computeAmountTrend(recentAmounts);
        const entryAmount = config.expectedAmount;

        let entryNotes: string | undefined;
        const notesParts: string[] = [];

        if (trend) {
          const direction = trend.averageDelta > 0 ? '+' : '';
          notesParts.push(
            `Valor sugerido: R$ ${trend.suggestedAmount.toFixed(2)} (tendência ${direction}R$ ${trend.averageDelta.toFixed(2)}/período)`,
          );
        }

        if (isNearExpiry(config)) {
          notesParts.push(
            'Atenção: recorrência próxima do vencimento do contrato.',
          );
        }

        // If dueDate was adjusted due to holiday/weekend
        if (adjustedDueDate.getTime() !== currentDueDate.getTime()) {
          notesParts.push(
            `Data de vencimento ajustada de ${currentDueDate.toISOString().slice(0, 10)} para ${adjustedDueDate.toISOString().slice(0, 10)} (dia não útil).`,
          );
        }

        if (notesParts.length > 0) {
          entryNotes = notesParts.join(' | ');
        }

        const code = await this.financeEntriesRepository.generateNextCode(
          tenantId,
          config.type,
        );

        await this.financeEntriesRepository.create({
          tenantId,
          type: config.type as FinanceEntryType,
          code,
          description: `${config.description} (${installmentNumber})`,
          notes: entryNotes,
          categoryId: config.categoryId.toString(),
          costCenterId: config.costCenterId?.toString(),
          bankAccountId: config.bankAccountId?.toString(),
          supplierName: config.supplierName,
          customerName: config.customerName,
          supplierId: config.supplierId,
          customerId: config.customerId,
          expectedAmount: entryAmount,
          issueDate: new Date(),
          dueDate: adjustedDueDate,
          recurrenceType: 'RECURRING',
          recurrenceInterval: config.frequencyInterval,
          recurrenceUnit: config.frequencyUnit as RecurrenceUnit,
          currentInstallment: installmentNumber,
          createdBy: config.createdBy,
          metadata: {
            originalDueDate: currentDueDate.toISOString(),
            ...(trend && { suggestedAmount: trend.suggestedAmount }),
            ...(isNearExpiry(config) && { isNearExpiry: true }),
          },
        });

        // Track the amount for ongoing trend detection within this batch.
        // P1-12: keep only the last TREND_BUFFER_MAX_SIZE samples so the
        // array doesn't grow unbounded on long-running configs.
        recentAmounts.push(entryAmount);
        if (recentAmounts.length > TREND_BUFFER_MAX_SIZE) {
          recentAmounts.splice(0, recentAmounts.length - TREND_BUFFER_MAX_SIZE);
        }

        generatedForConfig++;
        currentDueDate = calculateNextDate(
          currentDueDate,
          config.frequencyInterval,
          config.frequencyUnit,
        );
      }

      if (generatedForConfig > 0) {
        await this.recurringConfigsRepository.update({
          id: config.id.toString(),
          tenantId,
          generatedCount: config.generatedCount + generatedForConfig,
          lastGeneratedDate: new Date(),
          nextDueDate: currentDueDate,
        });

        totalGenerated += generatedForConfig;
      }

      // Contract expiry: auto-pause if endDate has passed and no future entries remain
      if (config.endDate && currentDueDate && currentDueDate > config.endDate) {
        await this.recurringConfigsRepository.update({
          id: config.id.toString(),
          tenantId,
          status: 'PAUSED',
          notes: config.notes
            ? `${config.notes}\n[Auto-pause] Recorrência pausada automaticamente — data de término expirada.`
            : '[Auto-pause] Recorrência pausada automaticamente — data de término expirada.',
        });
        pausedByExpiry++;
      }
    }

    return {
      generatedCount: totalGenerated,
      configsProcessed: activeConfigs.length,
      pausedByExpiry,
    };
  }
}
