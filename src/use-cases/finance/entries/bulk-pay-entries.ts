import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import type { FinanceApprovalRulesRepository } from '@/repositories/finance/finance-approval-rules-repository';
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
    private approvalRulesRepository?: FinanceApprovalRulesRepository,
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
          // Acquire row-level lock to prevent concurrent payment races
          const entry = await this.financeEntriesRepository.findByIdForUpdate(
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

          // Check approval rules: entries above the configured threshold require
          // explicit approval before bulk payment. A FLAG_REVIEW rule with
          // maxAmount=500 means "any entry over R$500 must be approved first".
          // Rules without maxAmount act as a blanket approval requirement.
          if (this.approvalRulesRepository) {
            const approvalRules =
              await this.approvalRulesRepository.findActiveByTenant(tenantId);

            const requiresApproval = approvalRules.some(
              (rule) =>
                rule.action === 'FLAG_REVIEW' &&
                (rule.maxAmount === undefined ||
                  rule.maxAmount === null ||
                  entry.expectedAmount > rule.maxAmount),
            );

            if (
              requiresApproval &&
              !entry.tags.includes('auto-approved') &&
              !entry.tags.includes('manually-approved')
            ) {
              errors.push({
                entryId,
                error: 'Lançamento requer aprovação antes do pagamento',
              });
              continue;
            }
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

          // actualAmount must reflect the sum of all payments applied —
          // previously-registered partial payments PLUS the remaining balance
          // just settled. Using entry.totalDue in isolation was mathematically
          // equivalent when totalDue never changed, but it hid the real sum
          // and could drift if totalDue were edited mid-flight. Compute it
          // explicitly from the payments we just accounted for.
          const newActualAmount = existingPaymentsSum + remainingBalance;

          await this.financeEntriesRepository.update(
            {
              id: new UniqueEntityID(entryId),
              tenantId,
              status: fullyPaidStatus,
              actualAmount: newActualAmount,
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
