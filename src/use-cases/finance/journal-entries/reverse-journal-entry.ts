import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  JournalEntriesRepository,
  JournalEntryWithLines,
} from '@/repositories/finance/journal-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface ReverseJournalEntryUseCaseRequest {
  tenantId: string;
  journalEntryId: string;
  createdBy?: string;
}

interface ReverseJournalEntryUseCaseResponse {
  reversalEntry: JournalEntryWithLines;
}

export class ReverseJournalEntryUseCase {
  constructor(
    private journalEntriesRepository: JournalEntriesRepository,
  ) {}

  async execute(
    request: ReverseJournalEntryUseCaseRequest,
  ): Promise<ReverseJournalEntryUseCaseResponse> {
    const { tenantId, journalEntryId, createdBy } = request;

    const original = await this.journalEntriesRepository.findById(
      new UniqueEntityID(journalEntryId),
      tenantId,
    );

    if (!original) {
      throw new ResourceNotFoundError('Lançamento contábil não encontrado');
    }

    if (original.status === 'REVERSED') {
      throw new BadRequestError('Este lançamento já foi estornado');
    }

    // Swap DEBIT ↔ CREDIT on each line
    const reversedLines = original.lines.map((line) => ({
      chartOfAccountId: line.chartOfAccountId,
      type: (line.type === 'DEBIT' ? 'CREDIT' : 'DEBIT') as 'DEBIT' | 'CREDIT',
      amount: line.amount,
      description: line.description ?? undefined,
    }));

    const code = await this.journalEntriesRepository.generateNextCode(tenantId);

    const reversalEntry = await this.journalEntriesRepository.create({
      tenantId,
      code,
      date: new Date(),
      description: `Estorno: ${original.description}`,
      sourceType: original.sourceType,
      sourceId: original.sourceId ?? undefined,
      lines: reversedLines,
      createdBy,
    });

    await this.journalEntriesRepository.markReversed(
      new UniqueEntityID(journalEntryId),
      reversalEntry.id,
    );

    await queueAuditLog({
      userId: createdBy ?? 'system',
      action: 'REVERSE',
      entity: 'JournalEntry',
      entityId: journalEntryId,
      module: 'finance',
      newData: { reversalEntryId: reversalEntry.id, reversalCode: reversalEntry.code },
    });

    return { reversalEntry };
  }
}
