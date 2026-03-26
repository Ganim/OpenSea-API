import { createHash } from 'node:crypto';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';

export interface RectifyEventRequest {
  tenantId: string;
  eventId: string;
  xmlContent: string;
}

export interface RectifyEventResponse {
  event: EsocialEvent;
}

/**
 * Creates a rectification event (indRetif=2) linked to the original event.
 *
 * Only events that have been ACCEPTED (have a receipt number) can be rectified.
 * The new event starts in DRAFT status and references the original.
 */
export class RectifyEventUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: RectifyEventRequest): Promise<RectifyEventResponse> {
    const originalEvent = await this.eventsRepository.findById(
      new UniqueEntityID(request.eventId),
      request.tenantId,
    );

    if (!originalEvent) {
      throw new ResourceNotFoundError('Evento eSocial original não encontrado');
    }

    if (originalEvent.status !== EsocialEventStatus.ACCEPTED) {
      throw new BadRequestError(
        `Apenas eventos ACCEPTED podem ser retificados. Status atual: ${originalEvent.status}`,
      );
    }

    const xmlHash = createHash('sha256')
      .update(request.xmlContent)
      .digest('hex');

    const rectificationEvent = await this.eventsRepository.create({
      tenantId: request.tenantId,
      eventType: originalEvent.eventType,
      referenceId: originalEvent.referenceId,
      referenceType: originalEvent.referenceType,
      xmlContent: request.xmlContent,
      xmlHash,
      originalEventId: originalEvent.id.toString(),
      isRectification: true,
      status: 'DRAFT',
    });

    return { event: rectificationEvent };
  }
}
