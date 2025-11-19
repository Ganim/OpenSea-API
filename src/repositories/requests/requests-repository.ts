import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Request } from '@/entities/requests/request';
import type { RequestStatus } from '@/entities/requests/value-objects/request-status';
import type { RequestType } from '@/entities/requests/value-objects/request-type';

export interface FindManyRequestsParams {
  requesterId?: string;
  assignedToId?: string;
  status?: RequestStatus;
  type?: RequestType;
  category?: string;
  page?: number;
  limit?: number;
}

export interface RequestsRepository {
  create(request: Request): Promise<void>;
  save(request: Request): Promise<void>;
  findById(id: UniqueEntityID): Promise<Request | null>;
  findMany(params: FindManyRequestsParams): Promise<Request[]>;
  countMany(
    params: Omit<FindManyRequestsParams, 'page' | 'limit'>,
  ): Promise<number>;
  delete(id: UniqueEntityID): Promise<void>;
}
