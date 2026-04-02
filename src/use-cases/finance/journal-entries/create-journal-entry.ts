import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { JournalSourceType } from '@/entities/finance/journal-entry';
import type {
  JournalEntriesRepository,
  JournalEntryWithLines,
} from '@/repositories/finance/journal-entries-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface CreateJournalEntryUseCaseRequest {
  tenantId: string;
  date: Date;
  description: string;
  sourceType: JournalSourceType;
  sourceId?: string;
  lines: Array<{
    chartOfAccountId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    description?: string;
  }>;
  createdBy?: string;
}

interface CreateJournalEntryUseCaseResponse {
  journalEntry: JournalEntryWithLines;
}

export class CreateJournalEntryUseCase {
  constructor(private journalEntriesRepository: JournalEntriesRepository) {}

  async execute(
    request: CreateJournalEntryUseCaseRequest,
  ): Promise<CreateJournalEntryUseCaseResponse> {
    const {
      tenantId,
      date,
      description,
      sourceType,
      sourceId,
      lines,
      createdBy,
    } = request;

    if (!lines || lines.length < 2) {
      throw new BadRequestError(
        'O lançamento contábil deve ter pelo menos 2 linhas',
      );
    }

    const debits = lines
      .filter((l) => l.type === 'DEBIT')
      .reduce((sum, l) => sum + l.amount, 0);

    const credits = lines
      .filter((l) => l.type === 'CREDIT')
      .reduce((sum, l) => sum + l.amount, 0);

    if (Math.abs(debits - credits) > 0.01) {
      throw new BadRequestError(
        'A soma dos débitos deve ser igual à soma dos créditos',
      );
    }

    const code = await this.journalEntriesRepository.generateNextCode(tenantId);

    const journalEntry = await this.journalEntriesRepository.create({
      tenantId,
      code,
      date,
      description,
      sourceType,
      sourceId,
      lines,
      createdBy,
    });

    await queueAuditLog({
      userId: createdBy ?? 'system',
      action: 'CREATE',
      entity: 'JournalEntry',
      entityId: journalEntry.id,
      module: 'finance',
      newData: {
        code: journalEntry.code,
        description: journalEntry.description,
      },
    });

    return { journalEntry };
  }
}
