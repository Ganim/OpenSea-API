import type { ReconciliationSuggestionDTO } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-to-dto';
import { reconciliationSuggestionToDTO } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-to-dto';
import type { ReconciliationSuggestionsRepository } from '@/repositories/finance/reconciliation-suggestions-repository';

interface ListReconciliationSuggestionsUseCaseRequest {
  tenantId: string;
  page?: number;
  limit?: number;
  status?: string;
  reconciliationId?: string;
}

interface ListReconciliationSuggestionsUseCaseResponse {
  suggestions: ReconciliationSuggestionDTO[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export class ListReconciliationSuggestionsUseCase {
  constructor(
    private reconciliationSuggestionsRepository: ReconciliationSuggestionsRepository,
  ) {}

  async execute(
    request: ListReconciliationSuggestionsUseCaseRequest,
  ): Promise<ListReconciliationSuggestionsUseCaseResponse> {
    const page = request.page ?? 1;
    const limit = request.limit ?? 20;

    const { suggestions, total } =
      await this.reconciliationSuggestionsRepository.findMany({
        tenantId: request.tenantId,
        page,
        limit,
        status: request.status,
        reconciliationId: request.reconciliationId,
      });

    return {
      suggestions: suggestions.map(reconciliationSuggestionToDTO),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
