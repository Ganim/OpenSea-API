import type { EmailAttachment } from '@/entities/email/email-attachment';
import type { EmailMessage } from '@/entities/email/email-message';

export interface CreateEmailMessageSchema {
  tenantId: string;
  accountId: string;
  folderId: string;
  remoteUid: number;
  messageId?: string | null;
  threadId?: string | null;
  fromAddress: string;
  fromName?: string | null;
  toAddresses: string[];
  ccAddresses?: string[];
  bccAddresses?: string[];
  subject: string;
  snippet?: string | null;
  bodyText?: string | null;
  bodyHtmlSanitized?: string | null;
  receivedAt: Date;
  sentAt?: Date | null;
  isRead?: boolean;
  isFlagged?: boolean;
  isAnswered?: boolean;
  hasAttachments?: boolean;
}

export interface EmailMessagesListParams {
  tenantId: string;
  accountId: string;
  folderId?: string;
  unread?: boolean;
  flagged?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  cursor?: string; // opaque base64 cursor (encodes receivedAt + id)
}

export interface EmailMessagesListResult {
  messages: EmailMessage[];
  total: number;
  nextCursor?: string | null; // null means no more pages
}

export interface UpdateEmailMessageSchema {
  id: string;
  tenantId: string;
  folderId?: string;
  isRead?: boolean;
  isFlagged?: boolean;
  isAnswered?: boolean;
  hasAttachments?: boolean;
  deletedAt?: Date | null;
}

export interface CreateEmailAttachmentSchema {
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
}

export interface CentralInboxListParams {
  tenantId: string;
  accountIds: string[];
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  cursor?: string; // opaque base64 cursor (encodes receivedAt + id)
}

export interface EmailMessagesRepository {
  create(data: CreateEmailMessageSchema): Promise<EmailMessage>;
  findById(id: string, tenantId: string): Promise<EmailMessage | null>;
  findByRfcMessageId(
    accountId: string,
    rfcMessageId: string,
  ): Promise<EmailMessage | null>;
  findByRemoteUid(
    accountId: string,
    folderId: string,
    remoteUid: number,
  ): Promise<EmailMessage | null>;
  findExistingRemoteUids(
    accountId: string,
    folderId: string,
    remoteUids: number[],
  ): Promise<Set<number>>;
  list(params: EmailMessagesListParams): Promise<EmailMessagesListResult>;
  listCentralInbox(params: CentralInboxListParams): Promise<EmailMessagesListResult>;
  update(data: UpdateEmailMessageSchema): Promise<EmailMessage | null>;
  updateBody(
    id: string,
    bodyText: string | null,
    bodyHtmlSanitized: string | null,
    snippet: string | null,
  ): Promise<void>;
  createAttachment(data: CreateEmailAttachmentSchema): Promise<EmailAttachment>;
  listAttachments(messageId: string): Promise<EmailAttachment[]>;
  findAttachmentById(id: string): Promise<EmailAttachment | null>;
  softDeleteByFolder(folderId: string, tenantId: string): Promise<number>;
  suggestContacts(
    accountIds: string[],
    query: string,
    limit: number,
  ): Promise<Array<{ email: string; name: string | null; frequency: number }>>;
  findThreadMessages(
    accountId: string,
    messageId: string,
    tenantId: string,
  ): Promise<EmailMessage[]>;
}
