import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

export type TrackableEntityType = 'quote' | 'proposal';

interface RecordViewUseCaseRequest {
  entityType: TrackableEntityType;
  entityId: string;
}

interface RecordViewUseCaseResponse {
  recorded: boolean;
}

export class RecordViewUseCase {
  constructor(
    private quotesRepository: QuotesRepository,
    private proposalsRepository: ProposalsRepository,
  ) {}

  async execute(
    input: RecordViewUseCaseRequest,
  ): Promise<RecordViewUseCaseResponse> {
    const { entityType, entityId } = input;

    let recorded = false;

    if (entityType === 'quote') {
      recorded = await this.quotesRepository.updateViewTracking(entityId);
    } else if (entityType === 'proposal') {
      recorded = await this.proposalsRepository.updateViewTracking(entityId);
    }

    return { recorded };
  }
}
