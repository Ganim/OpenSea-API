import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAttachment } from '@/entities/email/email-attachment';
import type { EmailAttachment as PrismaEmailAttachment } from '@prisma/generated/client.js';

export function mapEmailAttachmentPrismaToDomain(
  attachmentDb: PrismaEmailAttachment,
) {
  return {
    id: new UniqueEntityID(attachmentDb.id),
    messageId: new UniqueEntityID(attachmentDb.messageId),
    filename: attachmentDb.filename,
    contentType: attachmentDb.contentType,
    size: attachmentDb.size,
    storageKey: attachmentDb.storageKey,
    createdAt: attachmentDb.createdAt,
  };
}

export function emailAttachmentPrismaToDomain(
  attachmentDb: PrismaEmailAttachment,
): EmailAttachment {
  return EmailAttachment.create(
    mapEmailAttachmentPrismaToDomain(attachmentDb),
    new UniqueEntityID(attachmentDb.id),
  );
}
