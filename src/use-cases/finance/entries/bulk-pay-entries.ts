import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { FinanceEntryPaymentsRepository } from '@/repositories/finance/finance-entry-payments-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface BulkPayEntriesUseCaseRequest {
  tenantId: string;
  entryIds: string[];
  bankAccountId: string;
  method: string;
  reference?: string;
  paidAt?: Date;
  userId?: string;
}

interface BulkEntryError {
  entryId: string;
  error: string;
}

interface BulkPayEntriesUseCaseResponse {
  succeeded: number;
  failed: number;
  errors: BulkEntryError[];
}

const PAYABLE_STATUSES = ['PENDING', 'OVERDUE', 'PARTIALLY_PAID'] as const;

export class BulkPayEntriesUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private financeEntryPaymentsRepository: FinanceEntryPaymentsRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    request: BulkPayEntriesUseCaseRequest,
  ): Promise<BulkPayEntriesUseCaseResponse> {
    const { tenantId, entryIds, bankAccountId, method, reference, userId } =
      request;
    const paymentDate = request.paidAt ?? new Date();

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
            !PAYABLE_STATUSES.includes(
              entry.status as (typeof PAYABLE_STATUSES)[number],
            )
          ) {
            errors.push({
              entryId,
              error: `Cannot pay entry with status ${entry.status}`,
            });
            continue;
          }

          const existingPaymentsSum =
            await this.financeEntryPaymentsRepository.sumByEntryId(
              new UniqueEntityID(entryId),
              tx,
            );

          const remainingBalance = entry.totalDue - existingPaymentsSum;

          if (remainingBalance <= 0) {
            errors.push({ entryId, error: 'Entry has no remaining balance' });
            continue;
          }

          await this.financeEntryPaymentsRepository.create(
            {
              entryId,
              amount: remainingBalance,
              paidAt: paymentDate,
              bankAccountId,
              method,
              reference,
              createdBy: userId,
            },
            tx,
          );

          const fullyPaidStatus =
            entry.type === 'PAYABLE' ? 'PAID' : 'RECEIVED';

          await this.financeEntriesRepository.update(
            {
              id: new UniqueEntityID(entryId),
              tenantId,
              status: fullyPaidStatus,
              actualAmount: entry.totalDue,
              paymentDate,
            },
            tx,
          );

          succeededCount++;
        } catch (entryError) {
          const errorMessage =
            entryError instanceof Error
              ? entryError.message
              : 'Unknown error during payment';
          errors.push({ entryId, error: errorMessage });
        }
      }
    });

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_BULK_PAY',
      entity: 'FINANCE_ENTRY',
      entityId: entryIds[0],
      module: 'FINANCE',
      description: `Bulk paid ${succeededCount} finance entries`,
      newData: {
        entryIds,
        bankAccountId,
        method,
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
