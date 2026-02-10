import { prisma } from '@/lib/prisma';
import { financeAttachmentPrismaToDomain } from '@/mappers/finance/finance-attachment/finance-attachment-prisma-to-domain';
import type { FinanceAttachmentType } from '@prisma/generated/client.js';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FinanceAttachment } from '@/entities/finance/finance-attachment';
import type {
  FinanceAttachmentsRepository,
  CreateFinanceAttachmentSchema,
} from '../finance-attachments-repository';

export class PrismaFinanceAttachmentsRepository implements FinanceAttachmentsRepository {
  async create(data: CreateFinanceAttachmentSchema): Promise<FinanceAttachment> {
    const attachment = await prisma.financeAttachment.create({
      data: {
        tenantId: data.tenantId,
        entryId: data.entryId,
        type: (data.type as FinanceAttachmentType) ?? 'OTHER',
        fileName: data.fileName,
        fileKey: data.fileKey,
        fileSize: data.fileSize,
        mimeType: data.mimeType,
        uploadedBy: data.uploadedBy,
      },
    });

    return financeAttachmentPrismaToDomain(attachment);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<FinanceAttachment | null> {
    const attachment = await prisma.financeAttachment.findFirst({
      where: {
        id: id.toString(),
        tenantId,
      },
    });

    if (!attachment) return null;
    return financeAttachmentPrismaToDomain(attachment);
  }

  async findManyByEntryId(entryId: string, tenantId: string): Promise<FinanceAttachment[]> {
    const attachments = await prisma.financeAttachment.findMany({
      where: {
        entryId,
        tenantId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return attachments.map(financeAttachmentPrismaToDomain);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.financeAttachment.delete({
      where: {
        id: id.toString(),
      },
    });
  }
}
