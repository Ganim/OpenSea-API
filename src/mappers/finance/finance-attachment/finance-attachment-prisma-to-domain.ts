import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FinanceAttachment } from '@/entities/finance/finance-attachment';
import type { FinanceAttachment as PrismaFinanceAttachment } from '@prisma/generated/client.js';

export function financeAttachmentPrismaToDomain(raw: PrismaFinanceAttachment): FinanceAttachment {
  return FinanceAttachment.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      entryId: new UniqueEntityID(raw.entryId),
      type: raw.type,
      fileName: raw.fileName,
      fileKey: raw.fileKey,
      fileSize: raw.fileSize,
      mimeType: raw.mimeType,
      uploadedBy: raw.uploadedBy ?? undefined,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}
