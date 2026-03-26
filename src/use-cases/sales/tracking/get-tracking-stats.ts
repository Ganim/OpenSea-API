import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProposalsRepository } from '@/repositories/sales/proposals-repository';
import type { QuotesRepository } from '@/repositories/sales/quotes-repository';

import type { TrackableEntityType } from './record-view';

interface GetTrackingStatsUseCaseRequest {
  tenantId: string;
  entityType: TrackableEntityType;
  entityId: string;
}

interface TrackingStatsResponse {
  viewCount: number;
  viewedAt: Date | undefined;
  lastViewedAt: Date | undefined;
}

interface GetTrackingStatsUseCaseResponse {
  trackingStats: TrackingStatsResponse;
}

export class GetTrackingStatsUseCase {
  constructor(
    private quotesRepository: QuotesRepository,
    private proposalsRepository: ProposalsRepository,
  ) {}

  async execute(
    input: GetTrackingStatsUseCaseRequest,
  ): Promise<GetTrackingStatsUseCaseResponse> {
    const { tenantId, entityType, entityId } = input;

    if (entityType === 'quote') {
      const quote = await this.quotesRepository.findById(
        new UniqueEntityID(entityId),
        tenantId,
      );

      if (!quote) {
        throw new ResourceNotFoundError('Quote not found.');
      }

      return {
        trackingStats: {
          viewCount: quote.viewCount,
          viewedAt: quote.viewedAt,
          lastViewedAt: quote.lastViewedAt,
        },
      };
    }

    const proposal = await this.proposalsRepository.findById(
      new UniqueEntityID(entityId),
      tenantId,
    );

    if (!proposal) {
      throw new ResourceNotFoundError('Proposal not found.');
    }

    return {
      trackingStats: {
        viewCount: proposal.viewCount,
        viewedAt: proposal.viewedAt,
        lastViewedAt: proposal.lastViewedAt,
      },
    };
  }
}
