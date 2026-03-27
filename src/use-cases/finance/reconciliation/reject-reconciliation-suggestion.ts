import { ErrorCodes } from '@/@errors/error-codes';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ReconciliationSuggestionDTO } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-to-dto';
import { reconciliationSuggestionToDTO } from '@/mappers/finance/reconciliation-suggestion/reconciliation-suggestion-to-dto';
import type { ReconciliationSuggestionsRepository } from '@/repositories/finance/reconciliation-suggestions-repository';

interface RejectReconciliationSuggestionUseCaseRequest {
  tenantId: string;
  suggestionId: string;
  userId: string;
}

interface RejectReconciliationSuggestionUseCaseResponse {
  suggestion: ReconciliationSuggestionDTO;
}

export class RejectReconciliationSuggestionUseCase {
  constructor(
    private reconciliationSuggestionsRepository: ReconciliationSuggestionsRepository,
  ) {}

  async execute(
    request: RejectReconciliationSuggestionUseCaseRequest,
  ): Promise<RejectReconciliationSuggestionUseCaseResponse> {
    const { tenantId, suggestionId, userId } = request;

    const suggestion = await this.reconciliationSuggestionsRepository.findById(
      new UniqueEntityID(suggestionId),
      tenantId,
    );

    if (!suggestion) {
      throw new ResourceNotFoundError(
        'Reconciliation suggestion not found',
        ErrorCodes.RESOURCE_NOT_FOUND,
      );
    }

    if (!suggestion.isPending) {
      throw new BadRequestError(
        'Suggestion has already been reviewed',
        ErrorCodes.BAD_REQUEST,
      );
    }

    const updatedSuggestion =
      await this.reconciliationSuggestionsRepository.updateStatus(
        new UniqueEntityID(suggestionId),
        'REJECTED',
        userId,
      );

    return {
      suggestion: reconciliationSuggestionToDTO(updatedSuggestion!),
    };
  }
}
