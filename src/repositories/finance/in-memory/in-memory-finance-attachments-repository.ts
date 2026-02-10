import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceAttachment } from '@/entities/finance/finance-attachment';
import type {
  FinanceAttachmentsRepository,
  CreateFinanceAttachmentSchema,
} from '../finance-attachments-repository';

export class InMemoryFinanceAttachmentsRepository implements FinanceAttachmentsRepository {
  public items: FinanceAttachment[] = [];

  async create(data: CreateFinanceAttachmentSchema): Promise<FinanceAttachment> {
    const attachment = FinanceAttachment.create({
      tenantId: new UniqueEntityID(data.tenantId),
      entryId: new UniqueEntityID(data.entryId),
      type: data.type ?? 'OTHER',
      fileName: data.fileName,
      fileKey: data.fileKey,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy,
    });

    this.items.push(attachment);
    return attachment;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<FinanceAttachment | null> {
    const attachment = this.items.find(
      (i) => i.id.toString() === id.toString() && i.tenantId.toString() === tenantId,
    );
    return attachment ?? null;
  }

  async findManyByEntryId(entryId: string, tenantId: string): Promise<FinanceAttachment[]> {
    return this.items
      .filter(
        (i) => i.entryId.toString() === entryId && i.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.toString() === id.toString());
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
