import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  JournalEntriesRepository,
  JournalEntryWithLines,
} from '@/repositories/finance/journal-entries-repository';

interface GetJournalEntryByIdUseCaseRequest {
  tenantId: string;
  id: string;
}

interface GetJournalEntryByIdUseCaseResponse {
  journalEntry: JournalEntryWithLines;
}

export class GetJournalEntryByIdUseCase {
  constructor(private journalEntriesRepository: JournalEntriesRepository) {}

  async execute(
    request: GetJournalEntryByIdUseCaseRequest,
  ): Promise<GetJournalEntryByIdUseCaseResponse> {
    const { tenantId, id } = request;

    const journalEntry = await this.journalEntriesRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!journalEntry) {
      throw new ResourceNotFoundError('Lançamento contábil não encontrado');
    }

    return { journalEntry };
  }
}
