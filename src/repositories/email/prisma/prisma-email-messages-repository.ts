import type { EmailAttachment } from '@/entities/email/email-attachment';
import type { EmailMessage } from '@/entities/email/email-message';
import { prisma } from '@/lib/prisma';
import {
    emailAttachmentPrismaToDomain,
    emailMessagePrismaToDomain,
} from '@/mappers/email';
import type {
    CentralInboxListParams,
    CreateEmailAttachmentSchema,
    CreateEmailMessageSchema,
    EmailMessagesListParams,
    EmailMessagesListResult,
    EmailMessagesRepository,
    UpdateEmailMessageSchema,
} from '../email-messages-repository';

export class PrismaEmailMessagesRepository implements EmailMessagesRepository {
  async create(data: CreateEmailMessageSchema): Promise<EmailMessage> {
    const messageDb = await prisma.emailMessage.create({
      data: {
        tenantId: data.tenantId,
        accountId: data.accountId,
        folderId: data.folderId,
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
    });

    return emailMessagePrismaToDomain(messageDb);
  }

  async findById(id: string, tenantId: string): Promise<EmailMessage | null> {
    const messageDb = await prisma.emailMessage.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    return messageDb ? emailMessagePrismaToDomain(messageDb) : null;
  }

  async findByRemoteUid(
    accountId: string,
    folderId: string,
    remoteUid: number,
  ): Promise<EmailMessage | null> {
    const messageDb = await prisma.emailMessage.findFirst({
      where: { accountId, folderId, remoteUid },
    });

    return messageDb ? emailMessagePrismaToDomain(messageDb) : null;
  }

  async findByRfcMessageId(
    accountId: string,
    rfcMessageId: string,
  ): Promise<EmailMessage | null> {
    const messageDb = await prisma.emailMessage.findFirst({
      where: { accountId, messageId: rfcMessageId, deletedAt: null },
    });

    return messageDb ? emailMessagePrismaToDomain(messageDb) : null;
  }

  async findExistingRemoteUids(
    accountId: string,
    folderId: string,
    remoteUids: number[],
  ): Promise<Set<number>> {
    if (remoteUids.length === 0) return new Set();

    const rows = await prisma.emailMessage.findMany({
      where: { accountId, folderId, remoteUid: { in: remoteUids } },
      select: { remoteUid: true },
    });

    return new Set(rows.map((r) => r.remoteUid));
  }

  async list(
    params: EmailMessagesListParams,
  ): Promise<EmailMessagesListResult> {
    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 20, 100);
    const skip = (page - 1) * limit;
    const search = params.search?.trim();

    if (!search) {
      const where = {
        tenantId: params.tenantId,
        accountId: params.accountId,
        ...(params.folderId ? { folderId: params.folderId } : {}),
        ...(params.unread !== undefined ? { isRead: !params.unread } : {}),
        deletedAt: null,
      };

      const [messages, total] = await Promise.all([
        prisma.emailMessage.findMany({
          where,
          orderBy: { receivedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.emailMessage.count({ where }),
      ]);

      return {
        messages: messages.map(emailMessagePrismaToDomain),
        total,
      };
    }

    const paramsList: Array<string | number | boolean> = [
      params.tenantId,
      params.accountId,
    ];
    let index = paramsList.length + 1;

    let whereClause =
      'WHERE tenant_id = $1 AND account_id = $2 AND deleted_at IS NULL';

    if (params.folderId) {
      whereClause += ` AND folder_id = $${index}`;
      paramsList.push(params.folderId);
      index += 1;
    }

    if (params.unread !== undefined) {
      whereClause += ` AND is_read = $${index}`;
      paramsList.push(!params.unread);
      index += 1;
    }

    whereClause += ` AND to_tsvector('simple', COALESCE(subject, '') || ' ' || COALESCE(from_address, '') || ' ' || COALESCE(from_name, '') || ' ' || COALESCE(snippet, '')) @@ plainto_tsquery('simple', $${index})`;
    paramsList.push(search);
    index += 1;

    const countQuery = `SELECT COUNT(*)::int AS count FROM email_messages ${whereClause}`;
    const listQuery = `SELECT id FROM email_messages ${whereClause} ORDER BY received_at DESC OFFSET $${index} LIMIT $${index + 1}`;

    const countParams = [...paramsList];
    const listParams = [...paramsList, skip, limit];

    const [countResult, rows] = await Promise.all([
      prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, ...countParams),
      prisma.$queryRawUnsafe<{ id: string }[]>(listQuery, ...listParams),
    ]);

    const total = Number(countResult?.[0]?.count ?? 0);
    const ids = rows.map((row) => row.id);

    if (!ids.length) {
      return { messages: [], total };
    }

    const messages = await prisma.emailMessage.findMany({
      where: { id: { in: ids } },
      orderBy: { receivedAt: 'desc' },
    });

    return {
      messages: messages.map(emailMessagePrismaToDomain),
      total,
    };
  }

  async update(data: UpdateEmailMessageSchema): Promise<EmailMessage | null> {
    const messageDb = await prisma.emailMessage.update({
      where: { id: data.id },
      data: {
        ...(data.folderId !== undefined && { folderId: data.folderId }),
        ...(data.isRead !== undefined && { isRead: data.isRead }),
        ...(data.isFlagged !== undefined && { isFlagged: data.isFlagged }),
        ...(data.isAnswered !== undefined && { isAnswered: data.isAnswered }),
        ...(data.hasAttachments !== undefined && {
          hasAttachments: data.hasAttachments,
        }),
        ...(data.deletedAt !== undefined && { deletedAt: data.deletedAt }),
      },
    });

    return messageDb ? emailMessagePrismaToDomain(messageDb) : null;
  }

  async updateBody(
    id: string,
    bodyText: string | null,
    bodyHtmlSanitized: string | null,
    snippet: string | null,
  ): Promise<void> {
    await prisma.emailMessage.update({
      where: { id },
      data: {
        bodyText,
        bodyHtmlSanitized,
        snippet,
      },
    });
  }

  async createAttachment(
    data: CreateEmailAttachmentSchema,
  ): Promise<EmailAttachment> {
    const attachmentDb = await prisma.emailAttachment.create({
      data: {
        messageId: data.messageId,
        filename: data.filename,
        contentType: data.contentType,
        size: data.size,
        storageKey: data.storageKey,
      },
    });

    return emailAttachmentPrismaToDomain(attachmentDb);
  }

  async listAttachments(messageId: string): Promise<EmailAttachment[]> {
    const attachments = await prisma.emailAttachment.findMany({
      where: { messageId },
      orderBy: { createdAt: 'asc' },
    });

    return attachments.map(emailAttachmentPrismaToDomain);
  }

  async findAttachmentById(id: string): Promise<EmailAttachment | null> {
    const attachment = await prisma.emailAttachment.findUnique({
      where: { id },
    });

    if (!attachment) return null;
    return emailAttachmentPrismaToDomain(attachment);
  }

  async listCentralInbox(
    params: CentralInboxListParams,
  ): Promise<EmailMessagesListResult> {
    if (params.accountIds.length === 0) {
      return { messages: [], total: 0 };
    }

    const page = params.page ?? 1;
    const limit = Math.min(params.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    // Find all INBOX folder IDs for the given accounts
    const inboxFolders = await prisma.emailFolder.findMany({
      where: {
        accountId: { in: params.accountIds },
        type: 'INBOX',
      },
      select: { id: true },
    });

    const inboxFolderIds = inboxFolders.map(f => f.id);

    if (inboxFolderIds.length === 0) {
      return { messages: [], total: 0 };
    }

    const where = {
      tenantId: params.tenantId,
      accountId: { in: params.accountIds },
      folderId: { in: inboxFolderIds },
      deletedAt: null,
      ...(params.unread !== undefined ? { isRead: !params.unread } : {}),
      ...(params.search
        ? {
            OR: [
              { subject: { contains: params.search, mode: 'insensitive' as const } },
              { fromAddress: { contains: params.search, mode: 'insensitive' as const } },
              { fromName: { contains: params.search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [messages, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.emailMessage.count({ where }),
    ]);

    return {
      messages: messages.map(emailMessagePrismaToDomain),
      total,
    };
  }

  async softDeleteByFolder(folderId: string, tenantId: string): Promise<number> {
    const result = await prisma.emailMessage.updateMany({
      where: {
        folderId,
        tenantId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return result.count;
  }
}
