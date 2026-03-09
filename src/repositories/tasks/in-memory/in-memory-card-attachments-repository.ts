import { randomUUID } from 'node:crypto';
import type {
  CardAttachmentsRepository,
  CardAttachmentRecord,
  CreateCardAttachmentSchema,
} from '../card-attachments-repository';

export class InMemoryCardAttachmentsRepository
  implements CardAttachmentsRepository
{
  public items: CardAttachmentRecord[] = [];

  async create(
    data: CreateCardAttachmentSchema,
  ): Promise<CardAttachmentRecord> {
    const attachment: CardAttachmentRecord = {
      id: randomUUID(),
      cardId: data.cardId,
      fileId: data.fileId,
      addedBy: data.addedBy,
      createdAt: new Date(),
      fileName: null,
      fileMimeType: null,
      fileSizeBytes: null,
    };

    this.items.push(attachment);
    return attachment;
  }

  async findById(
    id: string,
    cardId: string,
  ): Promise<CardAttachmentRecord | null> {
    return (
      this.items.find(
        (attachment) => attachment.id === id && attachment.cardId === cardId,
      ) ?? null
    );
  }

  async findByCardId(cardId: string): Promise<CardAttachmentRecord[]> {
    return this.items.filter((attachment) => attachment.cardId === cardId);
  }

  async delete(id: string, cardId: string): Promise<void> {
    this.items = this.items.filter(
      (attachment) => !(attachment.id === id && attachment.cardId === cardId),
    );
  }
}
