import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type {
  FinanceEntryRetentionRecord,
  FinanceEntryRetentionsRepository,
} from '@/repositories/finance/finance-entry-retentions-repository';
import {
  type RetentionConfig,
  type RetentionSummary,
  calculateAllRetentions,
} from '@/services/finance/tax-calculation.service';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface ApplyEntryRetentionsRequest {
  tenantId: string;
  entryId: string;
  config: RetentionConfig;
  userId?: string;
}

interface ApplyEntryRetentionsResponse {
  summary: RetentionSummary;
  retentions: FinanceEntryRetentionRecord[];
}

export class ApplyEntryRetentionsUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private retentionsRepository: FinanceEntryRetentionsRepository,
  ) {}

  async execute(
    request: ApplyEntryRetentionsRequest,
  ): Promise<ApplyEntryRetentionsResponse> {
    const { tenantId, entryId, config, userId } = request;

    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(entryId),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const grossAmount = Number(entry.expectedAmount);
    const summary = calculateAllRetentions(grossAmount, config);

    // Remove existing retentions before applying new ones
    await this.retentionsRepository.deleteByEntryId(entryId, tenantId);

    // Only persist retentions with amount > 0
    const toCreate = summary.retentions
      .filter((r) => r.amount > 0)
      .map((r) => ({
        tenantId,
        entryId,
        taxType: r.taxType,
        grossAmount: r.grossAmount,
        rate: r.rate,
        amount: r.amount,
        withheld: true,
        description: r.description,
      }));

    const retentions = await this.retentionsRepository.createMany(toCreate);

    // Audit log (fire-and-forget)
    queueAuditLog({
      userId,
      action: 'CREATE',
      entity: 'FINANCE_ENTRY',
      entityId: entryId,
      module: 'FINANCE',
      description: `Applied ${retentions.length} tax retention(s) to entry ${entry.code}: total retained R$ ${summary.totalRetained.toFixed(2)}`,
      newData: {
        retentions: retentions.map((r) => ({
          taxType: r.taxType,
          rate: r.rate,
          amount: r.amount,
        })),
        totalRetained: summary.totalRetained,
        netAmount: summary.netAmount,
      },
    }).catch(() => {});

    return { summary, retentions };
  }
}
