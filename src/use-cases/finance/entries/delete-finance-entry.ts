import { CannotDeletePaidEntryError } from '@/@errors/use-cases/cannot-delete-paid-entry-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import {
  assertPeriodNotLocked,
  type PeriodLockChecker,
} from '@/utils/finance/period-lock-guard';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface DeleteFinanceEntryUseCaseRequest {
  tenantId: string;
  id: string;
  userId?: string;
}

export class DeleteFinanceEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private periodLockChecker?: PeriodLockChecker,
  ) {}

  async execute({
    tenantId,
    id,
    userId,
  }: DeleteFinanceEntryUseCaseRequest): Promise<void> {
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    const undeletableStatuses = ['PAID', 'RECEIVED'];
    if (undeletableStatuses.includes(entry.status)) {
      throw new CannotDeletePaidEntryError(entry.status);
    }

    await assertPeriodNotLocked(tenantId, entry.dueDate, this.periodLockChecker);

    await this.financeEntriesRepository.delete(
      new UniqueEntityID(id),
      tenantId,
    );

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_DELETE',
      entity: 'FINANCE_ENTRY',
      entityId: id,
      module: 'FINANCE',
      description: `Deleted finance entry ${entry.code} (${entry.description})`,
      oldData: {
        code: entry.code,
        type: entry.type,
        status: entry.status,
        expectedAmount: entry.expectedAmount,
        description: entry.description,
      },
    }).catch(() => {});
  }
}
