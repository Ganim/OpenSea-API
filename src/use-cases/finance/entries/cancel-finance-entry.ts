import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logger } from '@/lib/logger';
import type {
  TransactionClient,
  TransactionManager,
} from '@/lib/transaction-manager';
import {
  type FinanceEntryDTO,
  financeEntryToDTO,
} from '@/mappers/finance/finance-entry/finance-entry-to-dto';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { JournalEntriesRepository } from '@/repositories/finance/journal-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface CancelFinanceEntryUseCaseRequest {
  tenantId: string;
  id: string;
  userId?: string;
}

interface CancelFinanceEntryUseCaseResponse {
  entry: FinanceEntryDTO;
}

export class CancelFinanceEntryUseCase {
  constructor(
    private financeEntriesRepository: FinanceEntriesRepository,
    private journalEntriesRepository?: JournalEntriesRepository,
    private reverseJournalEntry?: {
      execute(req: {
        tenantId: string;
        journalEntryId: string;
        createdBy?: string;
        tx?: TransactionClient;
      }): Promise<unknown>;
    },
    private transactionManager?: TransactionManager,
  ) {}

  async execute({
    tenantId,
    id,
    userId,
  }: CancelFinanceEntryUseCaseRequest): Promise<CancelFinanceEntryUseCaseResponse> {
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!entry) {
      throw new ResourceNotFoundError('Finance entry not found');
    }

    if (entry.status === 'PAID' || entry.status === 'RECEIVED') {
      throw new BadRequestError(
        'Cannot cancel an entry that is already paid or received',
      );
    }

    const runCancel = async (tx?: TransactionClient) => {
      const cancelled = await this.financeEntriesRepository.update(
        {
          id: new UniqueEntityID(id),
          tenantId,
          status: 'CANCELLED',
        },
        tx,
      );

      if (!cancelled) {
        throw new ResourceNotFoundError('Finance entry not found');
      }

      // Reverse any posted journal entries linked to this finance entry.
      // The reversal now runs inside the same transaction as the entry
      // status flip — a failed reversal rolls the cancel back, keeping
      // entry.status and journal.status consistent. Previously the two
      // writes were on separate connections and a crash between them
      // left the entry CANCELLED with its journals still POSTED.
      if (this.journalEntriesRepository && this.reverseJournalEntry) {
        const journals = await this.journalEntriesRepository.findBySource(
          tenantId,
          'FINANCE_ENTRY',
          id,
        );
        for (const journal of journals) {
          if (journal.status === 'POSTED') {
            await this.reverseJournalEntry.execute({
              tenantId,
              journalEntryId: journal.id,
              createdBy: userId,
              tx,
            });
          }
        }
      }

      return cancelled;
    };

    const cancelled = this.transactionManager
      ? await this.transactionManager.run((tx) => runCancel(tx))
      : await runCancel();

    queueAuditLog({
      userId,
      action: 'FINANCE_ENTRY_CANCEL',
      entity: 'FINANCE_ENTRY',
      entityId: id,
      module: 'FINANCE',
      description: `Cancelled finance entry ${entry.code} (${entry.description})`,
      oldData: {
        status: entry.status,
      },
      newData: {
        status: 'CANCELLED',
      },
      metadata: {
        code: entry.code,
        type: entry.type,
        expectedAmount: entry.expectedAmount,
      },
    }).catch((err) => {
      logger.warn(
        {
          err,
          context: 'CancelFinanceEntryUseCase.queueAuditLog',
          entryId: id,
        },
        'Failed to queue audit log for finance entry cancellation',
      );
    });

    return { entry: financeEntryToDTO(cancelled) };
  }
}
