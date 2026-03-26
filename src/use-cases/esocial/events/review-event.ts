import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';

export interface ReviewEventRequest {
  tenantId: string;
  eventId: string;
  reviewedBy: string;
  notes?: string;
}

export interface ReviewEventResponse {
  event: EsocialEvent;
}

/**
 * Transitions an event from DRAFT (or VALIDATED) to REVIEWED.
 */
export class ReviewEventUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: ReviewEventRequest): Promise<ReviewEventResponse> {
    const event = await this.eventsRepository.findById(
      new UniqueEntityID(request.eventId),
      request.tenantId,
    );

    if (!event) {
      throw new ResourceNotFoundError('Evento eSocial não encontrado');
    }

    if (
      event.status !== EsocialEventStatus.DRAFT &&
      event.status !== EsocialEventStatus.VALIDATED
    ) {
      throw new BadRequestError(
        `Evento no status "${event.status}" não pode ser revisado. Apenas DRAFT ou VALIDATED.`,
      );
    }

    event.markReviewed(request.reviewedBy, request.notes);
    await this.eventsRepository.save(event);

    return { event };
  }
}
