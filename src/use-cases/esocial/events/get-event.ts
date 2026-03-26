import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import type { EsocialEventsRepository } from '@/repositories/esocial/esocial-events-repository';

export interface GetEventRequest {
  tenantId: string;
  eventId: string;
}

export interface GetEventResponse {
  event: EsocialEvent;
}

export class GetEventUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: GetEventRequest): Promise<GetEventResponse> {
    const event = await this.eventsRepository.findById(
      new UniqueEntityID(request.eventId),
      request.tenantId,
    );

    if (!event) {
      throw new ResourceNotFoundError('Evento eSocial não encontrado');
    }

    return { event };
  }
}
