import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAttachment } from '@/entities/email/email-attachment';
import { EmailMessage } from '@/entities/email/email-message';
import type {
    CreateEmailAttachmentSchema,
    CreateEmailMessageSchema,
    EmailMessagesListParams,
    EmailMessagesListResult,
    EmailMessagesRepository,
    UpdateEmailMessageSchema,
} from '../email-messages-repository';

export class InMemoryEmailMessagesRepository
  implements EmailMessagesRepository
{
  public items: EmailMessage[] = [];
  public attachments: EmailAttachment[] = [];

  async create(data: CreateEmailMessageSchema): Promise<EmailMessage> {
    const message = EmailMessage.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        accountId: new UniqueEntityID(data.accountId),
        folderId: new UniqueEntityID(data.folderId),
        remoteUid: data.remoteUid,
        messageId: data.messageId ?? null,
        threadId: data.threadId ?? null,
        fromAddress: data.fromAddress,
        fromName: data.fromName ?? null,
        toAddresses: data.toAddresses,
        ccAddresses: data.ccAddresses ?? [],
        bccAddresses: data.bccAddresses ?? [],
        subject: data.subject,
        snippet: data.snippet ?? null,
        bodyText: data.bodyText ?? null,
        bodyHtmlSanitized: data.bodyHtmlSanitized ?? null,
        receivedAt: data.receivedAt,
        sentAt: data.sentAt ?? null,
        isRead: data.isRead ?? false,
        isFlagged: data.isFlagged ?? false,
        hasAttachments: data.hasAttachments ?? false,
      },
      new UniqueEntityID(),
    );

    this.items.push(message);
    return message;
  }

  async findById(id: string, tenantId: string): Promise<EmailMessage | null> {
    return (
      this.items.find(
        (item) =>
          item.id.toString() === id &&
          item.tenantId.toString() === tenantId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async findByRemoteUid(
    accountId: string,
    folderId: string,
    remoteUid: number,
  ): Promise<EmailMessage | null> {
    return (
      this.items.find(
        (item) =>
          item.accountId.toString() === accountId &&
          item.folderId.toString() === folderId &&
          item.remoteUid === remoteUid,
      ) ?? null
    );
  }

  async list(
    params: EmailMessagesListParams,
  ): Promise<EmailMessagesListResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const start = (page - 1) * limit;
    const search = params.search?.trim().toLowerCase();

    let filtered = this.items.filter(
      (item) =>
        item.tenantId.toString() === params.tenantId &&
        item.accountId.toString() === params.accountId &&
        !item.deletedAt,
    );

    if (params.folderId) {
      filtered = filtered.filter(
        (item) => item.folderId.toString() === params.folderId,
      );
    }

    if (params.unread !== undefined) {
      filtered = filtered.filter((item) => item.isRead !== params.unread);
    }

    if (search) {
      filtered = filtered.filter((item) => {
        const haystack = [
          item.subject,
          item.fromAddress,
          item.fromName ?? '',
          item.snippet ?? '',
          item.bodyText ?? '',
          item.bodyHtmlSanitized ?? '',
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(search);
      });
    }

    filtered.sort((a, b) => b.receivedAt.getTime() - a.receivedAt.getTime());

    const total = filtered.length;
    const messages = filtered.slice(start, start + limit);

    return { messages, total };
  }

  async update(data: UpdateEmailMessageSchema): Promise<EmailMessage | null> {
    const message = this.items.find(
      (item) =>
        item.id.toString() === data.id &&
        item.tenantId.toString() === data.tenantId,
    );

    if (!message) return null;

    if (data.folderId !== undefined) {
      message.folderId = new UniqueEntityID(data.folderId);
    }
    if (data.isRead !== undefined) message.isRead = data.isRead;
    if (data.isFlagged !== undefined) message.isFlagged = data.isFlagged;
    if (data.deletedAt !== undefined) message.deletedAt = data.deletedAt;

    return message;
  }

  async createAttachment(
    data: CreateEmailAttachmentSchema,
  ): Promise<EmailAttachment> {
    const attachment = EmailAttachment.create(
      {
        messageId: new UniqueEntityID(data.messageId),
        filename: data.filename,
        contentType: data.contentType,
        size: data.size,
        storageKey: data.storageKey,
      },
      new UniqueEntityID(),
    );

    this.attachments.push(attachment);
    return attachment;
  }

  async listAttachments(messageId: string): Promise<EmailAttachment[]> {
    return this.attachments.filter(
      (attachment) => attachment.messageId.toString() === messageId,
    );
  }
  async findAttachmentById(id: string): Promise<EmailAttachment | null> {
    return this.attachments.find((att) => att.id.toString() === id) ?? null;
  }}
