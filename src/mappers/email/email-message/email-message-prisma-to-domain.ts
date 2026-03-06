import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailMessage } from '@/entities/email/email-message';
import type { EmailMessage as PrismaEmailMessage } from '@prisma/generated/client.js';

export function mapEmailMessagePrismaToDomain(messageDb: PrismaEmailMessage) {
  return {
    id: new UniqueEntityID(messageDb.id),
    tenantId: new UniqueEntityID(messageDb.tenantId),
    accountId: new UniqueEntityID(messageDb.accountId),
    folderId: new UniqueEntityID(messageDb.folderId),
    remoteUid: messageDb.remoteUid,
    messageId: messageDb.messageId ?? null,
    threadId: messageDb.threadId ?? null,
    fromAddress: messageDb.fromAddress,
    fromName: messageDb.fromName ?? null,
    toAddresses: messageDb.toAddresses,
    ccAddresses: messageDb.ccAddresses ?? [],
    bccAddresses: messageDb.bccAddresses ?? [],
    subject: messageDb.subject,
    snippet: messageDb.snippet ?? null,
    bodyText: messageDb.bodyText ?? null,
    bodyHtmlSanitized: messageDb.bodyHtmlSanitized ?? null,
    receivedAt: messageDb.receivedAt,
    sentAt: messageDb.sentAt ?? null,
    isRead: messageDb.isRead,
    isFlagged: messageDb.isFlagged,
    isAnswered: messageDb.isAnswered,
    hasAttachments: messageDb.hasAttachments,
    deletedAt: messageDb.deletedAt ?? null,
    createdAt: messageDb.createdAt,
    updatedAt: messageDb.updatedAt,
  };
}

export function emailMessagePrismaToDomain(
  messageDb: PrismaEmailMessage,
): EmailMessage {
  return EmailMessage.create(
    mapEmailMessagePrismaToDomain(messageDb),
    new UniqueEntityID(messageDb.id),
  );
}
