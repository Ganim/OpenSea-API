import type { EsocialEvent } from '@/entities/esocial/esocial-event';
import type {
  EsocialEventsRepository,
  FindManyEsocialEventsParams,
} from '@/repositories/esocial/esocial-events-repository';

export interface ListEventsRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: string;
  eventType?: string;
  referenceType?: string;
  search?: string;
}

export interface ListEventsResponse {
  events: EsocialEvent[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
}

export class ListEventsUseCase {
  constructor(private eventsRepository: EsocialEventsRepository) {}

  async execute(request: ListEventsRequest): Promise<ListEventsResponse> {
    const { tenantId, page = 1, perPage = 20 } = request;

    const params: FindManyEsocialEventsParams = {
      tenantId,
      page,
      perPage,
      status: request.status,
      eventType: request.eventType,
      referenceType: request.referenceType,
      search: request.search,
    };

    const { events, total } = await this.eventsRepository.findMany(params);
    const totalPages = Math.ceil(total / perPage);

    return {
      events,
      meta: { total, page, perPage, totalPages },
    };
  }
}
