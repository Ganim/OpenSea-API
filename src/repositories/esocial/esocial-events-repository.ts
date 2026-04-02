import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialEvent } from '@/entities/esocial/esocial-event';

export interface FindManyEsocialEventsParams {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: string;
  eventType?: string;
  referenceId?: string;
  referenceType?: string;
  search?: string;
}

export interface FindManyEsocialEventsResult {
  events: EsocialEvent[];
  total: number;
}

export interface CreateEsocialEventData {
  tenantId: string;
  eventType: string;
  status?: string;
  referenceId?: string;
  referenceType?: string;
  xmlContent: string;
  xmlHash?: string;
  originalEventId?: string;
  isRectification?: boolean;
  deadline?: Date;
}

export interface EsocialEventsRepository {
  create(data: CreateEsocialEventData): Promise<EsocialEvent>;
  findById(id: UniqueEntityID, tenantId: string): Promise<EsocialEvent | null>;
  findMany(
    params: FindManyEsocialEventsParams,
  ): Promise<FindManyEsocialEventsResult>;
  save(event: EsocialEvent): Promise<void>;
  delete(id: UniqueEntityID): Promise<void>;
}
