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
  hasAttachments?: boolean;
}

export interface EmailMessagesListParams {
  tenantId: string;
  accountId: string;
  folderId?: string;
  unread?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface EmailMessagesListResult {
  messages: EmailMessage[];
  total: number;
}

export interface UpdateEmailMessageSchema {
  id: string;
  tenantId: string;
  folderId?: string;
  isRead?: boolean;
  isFlagged?: boolean;
  deletedAt?: Date | null;
}

export interface CreateEmailAttachmentSchema {
  messageId: string;
  filename: string;
  contentType: string;
  size: number;
  storageKey: string;
}

export interface EmailMessagesRepository {
  create(data: CreateEmailMessageSchema): Promise<EmailMessage>;
  findById(id: string, tenantId: string): Promise<EmailMessage | null>;
  findByRemoteUid(
    accountId: string,
    folderId: string,
    remoteUid: number,
  ): Promise<EmailMessage | null>;
  list(params: EmailMessagesListParams): Promise<EmailMessagesListResult>;
  update(data: UpdateEmailMessageSchema): Promise<EmailMessage | null>;
  createAttachment(data: CreateEmailAttachmentSchema): Promise<EmailAttachment>;
  listAttachments(messageId: string): Promise<EmailAttachment[]>;
  findAttachmentById(id: string): Promise<EmailAttachment | null>;
}
