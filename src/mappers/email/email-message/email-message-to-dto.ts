import type { EmailAttachment } from '@/entities/email/email-attachment';
import type { EmailMessage } from '@/entities/email/email-message';

export interface EmailMessageListItemDTO {
  id: string;
  accountId: string;
  folderId: string;
  subject: string;
  fromAddress: string;
  fromName: string | null;
  snippet: string | null;
  receivedAt: Date;
  isRead: boolean;
  isAnswered: boolean;
  hasAttachments: boolean;
}

export interface EmailAttachmentDTO {
  id: string;
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
  createdAt: Date;
}

export interface EmailMessageDTO {
  id: string;
  tenantId: string;
  accountId: string;
  folderId: string;
  remoteUid: number;
  messageId: string | null;
  threadId: string | null;
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  bccAddresses: string[];
  subject: string;
  snippet: string | null;
  bodyText: string | null;
  bodyHtmlSanitized: string | null;
  receivedAt: Date;
  sentAt: Date | null;
  isRead: boolean;
  isFlagged: boolean;
  hasAttachments: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  attachments?: EmailAttachmentDTO[];
}

export function emailMessageToListDTO(
  message: EmailMessage,
): EmailMessageListItemDTO {
  return {
    id: message.id.toString(),
    accountId: message.accountId.toString(),
    folderId: message.folderId.toString(),
    subject: message.subject,
    fromAddress: message.fromAddress,
    fromName: message.fromName,
    snippet: message.snippet,
    receivedAt: message.receivedAt,
    isRead: message.isRead,
    isAnswered: message.isAnswered,
    hasAttachments: message.hasAttachments,
  };
}

export function emailAttachmentToDTO(
  attachment: EmailAttachment,
): EmailAttachmentDTO {
  return {
    id: attachment.id.toString(),
    messageId: attachment.messageId.toString(),
    filename: attachment.filename,
    contentType: attachment.contentType,
    size: attachment.size,
    storageKey: attachment.storageKey,
    createdAt: attachment.createdAt,
  };
}

export function emailMessageToDTO(
  message: EmailMessage,
  attachments?: EmailAttachment[],
): EmailMessageDTO {
  return {
    id: message.id.toString(),
    tenantId: message.tenantId.toString(),
    accountId: message.accountId.toString(),
    folderId: message.folderId.toString(),
    remoteUid: message.remoteUid,
    messageId: message.messageId,
    threadId: message.threadId,
    fromAddress: message.fromAddress,
    fromName: message.fromName,
    toAddresses: message.toAddresses,
    ccAddresses: message.ccAddresses,
    bccAddresses: message.bccAddresses,
    subject: message.subject,
    snippet: message.snippet,
    bodyText: message.bodyText,
    bodyHtmlSanitized: message.bodyHtmlSanitized,
    receivedAt: message.receivedAt,
    sentAt: message.sentAt,
    isRead: message.isRead,
    isFlagged: message.isFlagged,
    isAnswered: message.isAnswered,
    hasAttachments: message.hasAttachments,
    deletedAt: message.deletedAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    attachments: attachments?.map(emailAttachmentToDTO),
  };
}
