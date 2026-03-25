import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface BulkDeleteEntriesUseCaseRequest {
  tenantId: string;
  entryIds: string[];
  userId?: string;
}

interface BulkEntryError {
  entryId: string;
  error: string;
}

interface BulkDeleteEntriesUseCaseResponse {
  succeeded: number;
  failed: number;
  errors: BulkEntryError[];
}

const UNDELETABLE_STATUSES = ['PAID', 'RECEIVED'] as const;

export class BulkDeleteEntriesUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    request: BulkDeleteEntriesUseCaseRequest,
  ): Promise<BulkDeleteEntriesUseCaseResponse> {
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
            UNDELETABLE_STATUSES.includes(
              entry.status as (typeof UNDELETABLE_STATUSES)[number],
            )
          ) {
            errors.push({
              entryId,
              error: `Cannot delete entry with status ${entry.status}`,
            });
            continue;
          }

          await this.financeEntriesRepository.delete(
            new UniqueEntityID(entryId),
            tenantId,
          );

          succeededCount++;
        } catch (entryError) {
          const errorMessage =
            entryError instanceof Error
              ? entryError.message
              : 'Unknown error during deletion';
          errors.push({ entryId, error: errorMessage });
        }
      }
    });

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_BULK_DELETE',
      entity: 'FINANCE_ENTRY',
      entityId: entryIds[0],
      module: 'FINANCE',
      description: `Bulk deleted ${succeededCount} finance entries`,
      newData: {
        entryIds,
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
