import type { JournalSourceType } from '@/entities/finance/journal-entry';
import type {
  JournalEntriesRepository,
  JournalEntryWithLines,
} from '@/repositories/finance/journal-entries-repository';

interface ListJournalEntriesUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  chartOfAccountId?: string;
  sourceType?: JournalSourceType;
  dateFrom?: Date;
  dateTo?: Date;
}

interface ListJournalEntriesUseCaseResponse {
  entries: JournalEntryWithLines[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListJournalEntriesUseCase {
  constructor(
    private journalEntriesRepository: JournalEntriesRepository,
  ) {}

  async execute(
    request: ListJournalEntriesUseCaseRequest,
  ): Promise<ListJournalEntriesUseCaseResponse> {
    const { tenantId, chartOfAccountId, sourceType, dateFrom, dateTo } = request;
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { entries, total } = await this.journalEntriesRepository.findMany(
      tenantId,
      {
        page,
        limit,
        chartOfAccountId,
        sourceType,
        dateFrom,
        dateTo,
      },
    );

    const pages = Math.ceil(total / limit);

    return {
      entries,
      meta: {
        total,
        page,
        limit,
        pages,
      },
    };
  }
}
