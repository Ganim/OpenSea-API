import { randomUUID } from 'node:crypto';
import type {
  CreateVariantAttachmentData,
  VariantAttachmentRecord,
  VariantAttachmentsRepository,
} from '../variant-attachments-repository';

export class InMemoryVariantAttachmentsRepository
  implements VariantAttachmentsRepository
{
  public items: VariantAttachmentRecord[] = [];

  async create(
    data: CreateVariantAttachmentData,
  ): Promise<VariantAttachmentRecord> {
    const record: VariantAttachmentRecord = {
      id: randomUUID(),
      variantId: data.variantId,
      tenantId: data.tenantId,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      label: data.label ?? null,
      order: data.order ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.push(record);
    return record;
  }

  async findByVariantId(variantId: string): Promise<VariantAttachmentRecord[]> {
    return this.items
      .filter((item) => item.variantId === variantId)
      .sort((a, b) => a.order - b.order);
  }

  async findById(id: string): Promise<VariantAttachmentRecord | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
