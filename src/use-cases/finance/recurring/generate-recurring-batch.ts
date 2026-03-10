import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { RecurringConfigsRepository } from '@/repositories/finance/recurring-configs-repository';

interface GenerateRecurringBatchUseCaseRequest {
  tenantId: string;
  endDate: Date;
}

interface GenerateRecurringBatchUseCaseResponse {
  generatedCount: number;
  configsProcessed: number;
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

    for (const config of activeConfigs) {
      let currentDueDate = config.nextDueDate;
      if (!currentDueDate) continue;

      let generatedForConfig = 0;

      while (currentDueDate <= endDate) {
        // Respect totalOccurrences limit
        if (
          config.totalOccurrences &&
          config.generatedCount + generatedForConfig >=
            config.totalOccurrences
        ) {
          break;
        }

        // Respect endDate on the config itself
        if (config.endDate && currentDueDate > config.endDate) {
          break;
        }

        const installmentNumber =
          config.generatedCount + generatedForConfig + 1;

        const code = await this.financeEntriesRepository.generateNextCode(
          tenantId,
          config.type,
        );

        await this.financeEntriesRepository.create({
          tenantId,
          type: config.type,
          code,
          description: `${config.description} (${installmentNumber})`,
          categoryId: config.categoryId.toString(),
          costCenterId: config.costCenterId?.toString(),
          bankAccountId: config.bankAccountId?.toString(),
          supplierName: config.supplierName,
          customerName: config.customerName,
          supplierId: config.supplierId,
          customerId: config.customerId,
          expectedAmount: config.expectedAmount,
          issueDate: new Date(),
          dueDate: new Date(currentDueDate),
          recurrenceType: 'RECURRING',
          recurrenceInterval: config.frequencyInterval,
          recurrenceUnit: config.frequencyUnit,
          currentInstallment: installmentNumber,
          createdBy: config.createdBy,
        });

        generatedForConfig++;
        currentDueDate = this.calculateNextDate(
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
    }

    return {
      generatedCount: totalGenerated,
      configsProcessed: activeConfigs.length,
    };
  }

  private calculateNextDate(
    baseDate: Date,
    interval: number,
    unit: string,
  ): Date {
    const date = new Date(baseDate);

    switch (unit) {
      case 'DAILY':
        date.setUTCDate(date.getUTCDate() + interval);
        break;
      case 'WEEKLY':
        date.setUTCDate(date.getUTCDate() + interval * 7);
        break;
      case 'BIWEEKLY':
        date.setUTCDate(date.getUTCDate() + interval * 14);
        break;
      case 'MONTHLY':
        date.setUTCMonth(date.getUTCMonth() + interval);
        break;
      case 'QUARTERLY':
        date.setUTCMonth(date.getUTCMonth() + interval * 3);
        break;
      case 'SEMIANNUAL':
        date.setUTCMonth(date.getUTCMonth() + interval * 6);
        break;
      case 'ANNUAL':
        date.setUTCFullYear(date.getUTCFullYear() + interval);
        break;
    }

    return date;
  }
}
