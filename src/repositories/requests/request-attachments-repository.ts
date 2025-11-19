import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestAttachment } from '@/entities/requests/request-attachment';

export interface RequestAttachmentsRepository {
  create(attachment: RequestAttachment): Promise<void>;
  findById(id: UniqueEntityID): Promise<RequestAttachment | null>;
  findManyByRequestId(requestId: UniqueEntityID): Promise<RequestAttachment[]>;
  delete(id: UniqueEntityID): Promise<void>;
}
