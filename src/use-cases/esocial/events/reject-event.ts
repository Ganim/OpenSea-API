import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';

export interface RejectEventRequest {
  tenantId: string;
  eventId: string;
  reason: string;
}

export interface RejectEventResponse {
  event: EsocialEvent;
}

/**
 * Rejects an event (from REVIEWED or VALIDATED) back to DRAFT with a reason.
 */
export class RejectEventUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: RejectEventRequest): Promise<RejectEventResponse> {
    const event = await this.eventsRepository.findById(
      new UniqueEntityID(request.eventId),
      request.tenantId,
    );

    if (!event) {
      throw new ResourceNotFoundError('Evento eSocial não encontrado');
    }

    if (
      event.status !== EsocialEventStatus.REVIEWED &&
      event.status !== EsocialEventStatus.VALIDATED
    ) {
      throw new BadRequestError(
        `Evento no status "${event.status}" não pode ser rejeitado. Apenas REVIEWED ou VALIDATED.`,
      );
    }

    event.backToDraft();
    // Store rejection reason in review notes
    event.updateXml(event.xmlContent, event.xmlHash);

    await this.eventsRepository.save(event);

    return { event };
  }
}
