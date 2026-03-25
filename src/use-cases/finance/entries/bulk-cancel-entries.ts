import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface BulkCancelEntriesUseCaseRequest {
  tenantId: string;
  entryIds: string[];
  reason?: string;
  userId?: string;
}

interface BulkEntryError {
  entryId: string;
  error: string;
}

interface BulkCancelEntriesUseCaseResponse {
  succeeded: number;
  failed: number;
  errors: BulkEntryError[];
}

const NON_CANCELLABLE_STATUSES = ['CANCELLED', 'PAID', 'RECEIVED'] as const;

export class BulkCancelEntriesUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    request: BulkCancelEntriesUseCaseRequest,
  ): Promise<BulkCancelEntriesUseCaseResponse> {
    const { tenantId, entryIds, userId } = request;

    const errors: BulkEntryError[] = [];
    let succeededCount = 0;

    await this.transactionManager.run(async (tx: TransactionClient) => {
      for (const entryId of entryIds) {
        try {
          const entry = await this.financeEntriesRepository.findById(
            new UniqueEntityID(entryId),
            tenantId,
            tx,
          );

          if (!entry) {
            errors.push({ entryId, error: 'Entry not found' });
            continue;
          }

          if (
            NON_CANCELLABLE_STATUSES.includes(
              entry.status as (typeof NON_CANCELLABLE_STATUSES)[number],
            )
          ) {
            errors.push({
              entryId,
              error: `Cannot cancel entry with status ${entry.status}`,
            });
            continue;
          }

          await this.financeEntriesRepository.update(
            {
              id: new UniqueEntityID(entryId),
              tenantId,
              status: 'CANCELLED',
            },
            tx,
          );

          succeededCount++;
        } catch (entryError) {
          const errorMessage =
            entryError instanceof Error
              ? entryError.message
              : 'Unknown error during cancellation';
          errors.push({ entryId, error: errorMessage });
        }
      }
    });

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_BULK_CANCEL',
      entity: 'FINANCE_ENTRY',
      entityId: entryIds[0],
      module: 'FINANCE',
      description: `Bulk cancelled ${succeededCount} finance entries`,
      newData: {
        entryIds,
        reason: request.reason,
        succeeded: succeededCount,
        failed: errors.length,
      },
    }).catch(() => {});

    return {
      succeeded: succeededCount,
      failed: errors.length,
      errors,
    };
  }
}
