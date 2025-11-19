import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestHistory } from '@/entities/requests/request-history';

export interface RequestHistoryRepository {
  create(history: RequestHistory): Promise<void>;
  findManyByRequestId(requestId: UniqueEntityID): Promise<RequestHistory[]>;
}
