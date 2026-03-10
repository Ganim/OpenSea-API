import { prisma } from '@/lib/prisma';
import type {
  CreateVariantAttachmentData,
  VariantAttachmentRecord,
  VariantAttachmentsRepository,
} from '../variant-attachments-repository';

export class PrismaVariantAttachmentsRepository
  implements VariantAttachmentsRepository
{
  async create(
    data: CreateVariantAttachmentData,
  ): Promise<VariantAttachmentRecord> {
    const record = await prisma.variantAttachment.create({
      data: {
        variantId: data.variantId,
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
      variantId: record.variantId,
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

  async findByVariantId(
    variantId: string,
  ): Promise<VariantAttachmentRecord[]> {
    const records = await prisma.variantAttachment.findMany({
      where: { variantId },
      orderBy: { order: 'asc' },
    });

    return records.map((record) => ({
      id: record.id,
      variantId: record.variantId,
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

  async findById(id: string): Promise<VariantAttachmentRecord | null> {
    const record = await prisma.variantAttachment.findUnique({
      where: { id },
    });

    if (!record) {
      return null;
    }

    return {
      id: record.id,
      variantId: record.variantId,
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
    await prisma.variantAttachment.delete({
      where: { id },
    });
  }
}
