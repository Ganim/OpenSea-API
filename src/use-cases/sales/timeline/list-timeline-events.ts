import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimelineEvent } from '@/entities/sales/timeline-event';
import type { DealsRepository } from '@/repositories/sales/deals-repository';
import type { TimelineEventsRepository } from '@/repositories/sales/timeline-events-repository';

interface ListTimelineEventsUseCaseRequest {
  dealId: string;
  tenantId: string;
}

interface ListTimelineEventsUseCaseResponse {
  events: TimelineEvent[];
}

export class ListTimelineEventsUseCase {
  constructor(
    private timelineEventsRepository: TimelineEventsRepository,
    private dealsRepository: DealsRepository,
  ) {}

  async execute(
    request: ListTimelineEventsUseCaseRequest,
  ): Promise<ListTimelineEventsUseCaseResponse> {
    const { dealId, tenantId } = request;

    const deal = await this.dealsRepository.findById(
      new UniqueEntityID(dealId),
      tenantId,
    );

    if (!deal) {
      throw new ResourceNotFoundError('Deal not found');
    }

    const events = await this.timelineEventsRepository.findManyByDeal(
      dealId,
      tenantId,
    );

    return { events };
  }
}
