import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { RequestAttachment } from '@/entities/requests/request-attachment';
import type { RequestAttachmentsRepository } from '../request-attachments-repository';

export class InMemoryRequestAttachmentsRepository
  implements RequestAttachmentsRepository
{
  public items: RequestAttachment[] = [];

  async create(attachment: RequestAttachment): Promise<void> {
    this.items.push(attachment);
  }

  async findById(id: UniqueEntityID): Promise<RequestAttachment | null> {
    const attachment = this.items.find(
      (item) => item.id.toString() === id.toString(),
    );

    return attachment ?? null;
  }

  async findManyByRequestId(
    requestId: UniqueEntityID,
  ): Promise<RequestAttachment[]> {
    return this.items.filter(
      (item) => item.requestId.toString() === requestId.toString(),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const itemIndex = this.items.findIndex(
      (item) => item.id.toString() === id.toString(),
    );

    if (itemIndex >= 0) {
      this.items.splice(itemIndex, 1);
    }
  }
}
