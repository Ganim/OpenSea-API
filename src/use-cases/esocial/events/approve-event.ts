import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';

export interface ApproveEventRequest {
  tenantId: string;
  eventId: string;
  approvedBy: string;
}

export interface ApproveEventResponse {
  event: EsocialEvent;
}

/**
 * Transitions an event from REVIEWED to APPROVED.
 */
export class ApproveEventUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: ApproveEventRequest): Promise<ApproveEventResponse> {
    const event = await this.eventsRepository.findById(
      new UniqueEntityID(request.eventId),
      request.tenantId,
    );

    if (!event) {
      throw new ResourceNotFoundError('Evento eSocial não encontrado');
    }

    if (event.status !== EsocialEventStatus.REVIEWED) {
      throw new BadRequestError(
        `Evento no status "${event.status}" não pode ser aprovado. Apenas REVIEWED.`,
      );
    }

    event.markApproved(request.approvedBy);
    await this.eventsRepository.save(event);

    return { event };
  }
}
