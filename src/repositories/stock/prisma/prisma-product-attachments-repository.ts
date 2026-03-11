import { prisma } from '@/lib/prisma';
import type {
  CreateProductAttachmentData,
  ProductAttachmentRecord,
  ProductAttachmentsRepository,
} from '../product-attachments-repository';

export class PrismaProductAttachmentsRepository
  implements ProductAttachmentsRepository
{
  async create(
    data: CreateProductAttachmentData,
  ): Promise<ProductAttachmentRecord> {
    const record = await prisma.productAttachment.create({
      data: {
        productId: data.productId,
        tenantId: data.tenantId,
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        label: data.label ?? null,
        order: data.order ?? 0,
      },
    });

    return {
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      label: record.label,
      order: record.order,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async findByProductId(productId: string): Promise<ProductAttachmentRecord[]> {
    const records = await prisma.productAttachment.findMany({
      where: { productId },
      orderBy: { order: 'asc' },
    });

    return records.map((record) => ({
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      label: record.label,
      order: record.order,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    }));
  }

  async findById(id: string): Promise<ProductAttachmentRecord | null> {
    const record = await prisma.productAttachment.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      productId: record.productId,
      tenantId: record.tenantId,
      fileUrl: record.fileUrl,
      fileName: record.fileName,
      fileSize: record.fileSize,
      mimeType: record.mimeType,
      label: record.label,
      order: record.order,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.productAttachment.delete({
      where: { id },
    });
  }
}
