import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EsocialEventStatus } from '@/entities/esocial/value-objects/event-status';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';

export interface DeleteEventRequest {
  tenantId: string;
  eventId: string;
}

/**
 * Deletes an eSocial event. Only DRAFT events can be deleted.
 */
export class DeleteEventUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: DeleteEventRequest): Promise<void> {
    const event = await this.eventsRepository.findById(
      new UniqueEntityID(request.eventId),
      request.tenantId,
    );

    if (!event) {
      throw new ResourceNotFoundError('Evento eSocial não encontrado');
    }

    if (event.status !== EsocialEventStatus.DRAFT) {
      throw new BadRequestError(
        `Apenas eventos em DRAFT podem ser excluídos. Status atual: ${event.status}`,
      );
    }

    await this.eventsRepository.delete(event.id);
  }
}
