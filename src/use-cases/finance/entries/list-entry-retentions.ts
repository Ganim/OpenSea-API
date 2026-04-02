import type {
  FinanceEntryRetentionRecord,
  FinanceEntryRetentionsRepository,
} from '@/repositories/finance/finance-entry-retentions-repository';

interface ListEntryRetentionsRequest {
  tenantId: string;
  entryId: string;
}

interface ListEntryRetentionsResponse {
  retentions: FinanceEntryRetentionRecord[];
  totalRetained: number;
}

export class ListEntryRetentionsUseCase {
  constructor(private retentionsRepository: FinanceEntryRetentionsRepository) {}

  async execute(
    request: ListEntryRetentionsRequest,
  ): Promise<ListEntryRetentionsResponse> {
    const { tenantId, entryId } = request;

    const retentions = await this.retentionsRepository.findByEntryId(
      entryId,
      tenantId,
    );

    const totalRetained = retentions.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    return {
      retentions,
      totalRetained: Math.round(totalRetained * 100) / 100,
    };
  }
}
