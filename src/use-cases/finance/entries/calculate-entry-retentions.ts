import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import {
  type RetentionConfig,
  type RetentionSummary,
  calculateAllRetentions,
} from '@/services/finance/tax-calculation.service';

interface CalculateEntryRetentionsRequest {
  tenantId: string;
  entryId: string;
  config: RetentionConfig;
}

interface CalculateEntryRetentionsResponse {
  summary: RetentionSummary;
}

export class CalculateEntryRetentionsUseCase {
  constructor(private financeEntriesRepository: FinanceEntriesRepository) {}

  async execute(
    request: CalculateEntryRetentionsRequest,
  ): Promise<CalculateEntryRetentionsResponse> {
    const { tenantId, entryId, config } = request;

    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const grossAmount = Number(entry.expectedAmount);
    const summary = calculateAllRetentions(grossAmount, config);

    return { summary };
  }
}
