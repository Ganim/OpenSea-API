import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { EmailAttachment } from '@/entities/email/email-attachment';
import { EmailMessage } from '@/entities/email/email-message';
import type {
    CentralInboxListParams,
    CreateEmailAttachmentSchema,
    CreateEmailMessageSchema,
    EmailMessagesListParams,
    EmailMessagesListResult,
    EmailMessagesRepository,
    UpdateEmailMessageSchema,
} from '../email-messages-repository';

function encodeCursor(receivedAt: Date, id: string): string {
  return Buffer.from(JSON.stringify({ r: receivedAt.toISOString(), i: id })).toString('base64');
}

function decodeCursor(cursor: string): { receivedAt: Date; id: string } | null {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
    if (typeof parsed.r !== 'string' || typeof parsed.i !== 'string') return null;
    const date = new Date(parsed.r);
    if (isNaN(date.getTime())) return null;
    return { receivedAt: date, id: parsed.i };
  } catch {
    return null;
  }
}

function applyCursorFilter(
  sorted: EmailMessage[],
  cursorData: { receivedAt: Date; id: string },
): EmailMessage[] {
  return sorted.filter((m) => {
    const mTime = m.receivedAt.getTime();
    const cTime = cursorData.receivedAt.getTime();
    if (mTime < cTime) return true;
    if (mTime === cTime && m.id.toString() < cursorData.id) return true;
    return false;
  });
}

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
        isAnswered: data.isAnswered ?? false,
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

  async findByRfcMessageId(
    accountId: string,
    rfcMessageId: string,
  ): Promise<EmailMessage | null> {
    return (
      this.items.find(
        (item) =>
          item.accountId.toString() === accountId &&
          item.messageId === rfcMessageId &&
          !item.deletedAt,
      ) ?? null
    );
  }

  async findExistingRemoteUids(
    accountId: string,
    folderId: string,
    remoteUids: number[],
  ): Promise<Set<number>> {
    const uidSet = new Set(remoteUids);
    const existing = this.items.filter(
      (item) =>
        item.accountId.toString() === accountId &&
        item.folderId.toString() === folderId &&
        uidSet.has(item.remoteUid),
    );
    return new Set(existing.map((item) => item.remoteUid));
  }

  async list(
    params: EmailMessagesListParams,
  ): Promise<EmailMessagesListResult> {
    const limit = Math.min(params.limit ?? 20, 100);
    const cursorData = params.cursor ? decodeCursor(params.cursor) : null;
    const useCursor = !!cursorData;
    const page = params.page ?? 1;
    const start = useCursor ? 0 : (page - 1) * limit;
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

    if (params.flagged !== undefined) {
      filtered = filtered.filter((item) => item.isFlagged === params.flagged);
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

    // Sort by receivedAt DESC, id DESC
    filtered.sort((a, b) => {
      const timeDiff = b.receivedAt.getTime() - a.receivedAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id.toString().localeCompare(a.id.toString());
    });

    const total = filtered.length;

    // Apply cursor filter after sorting
    if (useCursor) {
      filtered = applyCursorFilter(filtered, cursorData!);
    }

    const messages = useCursor
      ? filtered.slice(0, limit)
      : filtered.slice(start, start + limit);

    const nextCursor = useCursor
      ? (messages.length === limit
        ? encodeCursor(messages[messages.length - 1].receivedAt, messages[messages.length - 1].id.toString())
        : null)
      : undefined;

    return { messages, total, nextCursor };
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
    if (data.isAnswered !== undefined) message.isAnswered = data.isAnswered;
    if (data.hasAttachments !== undefined)
      message.hasAttachments = data.hasAttachments;
    if (data.deletedAt !== undefined) message.deletedAt = data.deletedAt;

    return message;
  }

  async updateBody(
    id: string,
    bodyText: string | null,
    bodyHtmlSanitized: string | null,
    snippet: string | null,
  ): Promise<void> {
    const message = this.items.find((item) => item.id.toString() === id);

    if (message) {
      message.bodyText = bodyText;
      message.bodyHtmlSanitized = bodyHtmlSanitized;
      message.snippet = snippet;
    }
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
  }

  async listCentralInbox(
    params: CentralInboxListParams,
  ): Promise<EmailMessagesListResult> {
    const limit = params.limit ?? 50;
    const cursorData = params.cursor ? decodeCursor(params.cursor) : null;
    const useCursor = !!cursorData;
    const page = params.page ?? 1;
    const skip = useCursor ? 0 : (page - 1) * limit;

    let filtered = this.items.filter(
      (m) =>
        m.tenantId.toString() === params.tenantId &&
        params.accountIds.includes(m.accountId.toString()) &&
        !m.deletedAt,
    );

    if (params.unread !== undefined) {
      filtered = filtered.filter((m) => m.isRead === !params.unread);
    }

    if (params.search) {
      const s = params.search.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.subject.toLowerCase().includes(s) ||
          m.fromAddress.toLowerCase().includes(s) ||
          (m.fromName && m.fromName.toLowerCase().includes(s)),
      );
    }

    // Sort by receivedAt DESC, id DESC
    filtered.sort((a, b) => {
      const timeDiff = b.receivedAt.getTime() - a.receivedAt.getTime();
      if (timeDiff !== 0) return timeDiff;
      return b.id.toString().localeCompare(a.id.toString());
    });

    const total = filtered.length;

    if (useCursor) {
      filtered = applyCursorFilter(filtered, cursorData!);
    }

    const messages = useCursor
      ? filtered.slice(0, limit)
      : filtered.slice(skip, skip + limit);

    const nextCursor = useCursor
      ? (messages.length === limit
        ? encodeCursor(messages[messages.length - 1].receivedAt, messages[messages.length - 1].id.toString())
        : null)
      : undefined;

    return {
      messages,
      total,
      nextCursor,
    };
  }

  async suggestContacts(
    accountIds: string[],
    query: string,
    limit: number,
  ): Promise<Array<{ email: string; name: string | null; frequency: number }>> {
    const lowerQuery = query.toLowerCase();
    const frequencyMap = new Map<string, { name: string | null; frequency: number }>();

    const relevantMessages = this.items.filter(
      (m) => accountIds.includes(m.accountId.toString()) && !m.deletedAt,
    );

    for (const msg of relevantMessages) {
      // From addresses (received emails)
      if (
        msg.fromAddress.toLowerCase().includes(lowerQuery) ||
        (msg.fromName && msg.fromName.toLowerCase().includes(lowerQuery))
      ) {
        const key = msg.fromAddress.toLowerCase();
        const existing = frequencyMap.get(key);
        if (existing) {
          existing.frequency += 1;
          if (!existing.name && msg.fromName) {
            existing.name = msg.fromName;
          }
        } else {
          frequencyMap.set(key, {
            name: msg.fromName,
            frequency: 1,
          });
        }
      }

      // To addresses (sent emails)
      for (const addr of msg.toAddresses) {
        if (addr.toLowerCase().includes(lowerQuery)) {
          const key = addr.toLowerCase();
          const existing = frequencyMap.get(key);
          if (existing) {
            existing.frequency += 1;
          } else {
            frequencyMap.set(key, { name: null, frequency: 1 });
          }
        }
      }

      // CC addresses
      for (const addr of msg.ccAddresses) {
        if (addr.toLowerCase().includes(lowerQuery)) {
          const key = addr.toLowerCase();
          const existing = frequencyMap.get(key);
          if (existing) {
            existing.frequency += 1;
          } else {
            frequencyMap.set(key, { name: null, frequency: 1 });
          }
        }
      }
    }

    const results = Array.from(frequencyMap.entries())
      .map(([email, data]) => ({
        email,
        name: data.name,
        frequency: data.frequency,
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);

    return results;
  }

  async findThreadMessages(
    accountId: string,
    rfcMessageId: string,
    tenantId: string,
  ): Promise<EmailMessage[]> {
    const accountMessages = this.items.filter(
      (m) =>
        m.accountId.toString() === accountId &&
        m.tenantId.toString() === tenantId &&
        !m.deletedAt,
    );

    // Build a map of messageId → message for fast lookup
    const byMessageId = new Map<string, EmailMessage>();
    for (const msg of accountMessages) {
      if (msg.messageId) byMessageId.set(msg.messageId, msg);
    }

    // Find the target message
    const target = byMessageId.get(rfcMessageId);
    if (!target) return [];

    // Collect all thread members by walking up and down
    const collected = new Set<string>();
    const queue: EmailMessage[] = [target];

    while (queue.length > 0) {
      const current = queue.pop()!;
      if (collected.has(current.id.toString())) continue;
      collected.add(current.id.toString());

      // Walk UP: find parent
      if (current.threadId) {
        const parent = byMessageId.get(current.threadId);
        if (parent && !collected.has(parent.id.toString())) queue.push(parent);
      }

      // Walk DOWN: find children
      for (const msg of accountMessages) {
        if (
          msg.threadId === current.messageId &&
          current.messageId &&
          !collected.has(msg.id.toString())
        ) {
          queue.push(msg);
        }
      }
    }

    return accountMessages
      .filter((m) => collected.has(m.id.toString()))
      .sort((a, b) => a.receivedAt.getTime() - b.receivedAt.getTime());
  }

  async softDeleteByFolder(folderId: string, tenantId: string): Promise<number> {
    let count = 0;
    const now = new Date();
    for (const msg of this.items) {
      if (
        msg.folderId.toString() === folderId &&
        msg.tenantId.toString() === tenantId &&
        !msg.deletedAt
      ) {
        (msg as { deletedAt: Date | null }).deletedAt = now;
        count++;
      }
    }
    return count;
  }
}
