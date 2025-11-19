import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestComment } from '@/entities/requests/request-comment';

export interface RequestCommentsRepository {
  create(comment: RequestComment): Promise<void>;
  save(comment: RequestComment): Promise<void>;
  findById(id: UniqueEntityID): Promise<RequestComment | null>;
  findManyByRequestId(requestId: UniqueEntityID): Promise<RequestComment[]>;
  delete(id: UniqueEntityID): Promise<void>;
}
