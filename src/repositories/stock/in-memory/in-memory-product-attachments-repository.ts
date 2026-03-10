import { randomUUID } from 'node:crypto';
import type {
  CreateProductAttachmentData,
  ProductAttachmentRecord,
  ProductAttachmentsRepository,
} from '../product-attachments-repository';

export class InMemoryProductAttachmentsRepository
  implements ProductAttachmentsRepository
{
  public items: ProductAttachmentRecord[] = [];

  async create(
    data: CreateProductAttachmentData,
  ): Promise<ProductAttachmentRecord> {
    const record: ProductAttachmentRecord = {
      id: randomUUID(),
      productId: data.productId,
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

  async findByProductId(
    productId: string,
  ): Promise<ProductAttachmentRecord[]> {
    return this.items
      .filter((item) => item.productId === productId)
      .sort((a, b) => a.order - b.order);
  }

  async findById(id: string): Promise<ProductAttachmentRecord | null> {
    return this.items.find((item) => item.id === id) ?? null;
  }

  async delete(id: string): Promise<void> {
    const index = this.items.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
