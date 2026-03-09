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
    const limit = Math.min(params.limit ?? 20, 100);
    const search = params.search?.trim();
    const cursorData = params.cursor ? decodeCursor(params.cursor) : null;
    const useCursor = !!cursorData;

    // When using cursor, we don't need page/skip
    const page = params.page ?? 1;
    const skip = useCursor ? 0 : (page - 1) * limit;

    if (!search) {
      const baseWhere = {
        tenantId: params.tenantId,
        accountId: params.accountId,
        ...(params.folderId ? { folderId: params.folderId } : {}),
        ...(params.unread !== undefined ? { isRead: !params.unread } : {}),
        ...(params.flagged !== undefined ? { isFlagged: params.flagged } : {}),
        deletedAt: null,
      };

      const where = useCursor
        ? {
            ...baseWhere,
            OR: [
              { receivedAt: { lt: cursorData!.receivedAt } },
              { receivedAt: cursorData!.receivedAt, id: { lt: cursorData!.id } },
            ],
          }
        : baseWhere;

      const [messages, total] = await Promise.all([
        prisma.emailMessage.findMany({
          where,
          orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
          ...(useCursor ? {} : { skip }),
          take: limit,
        }),
        prisma.emailMessage.count({ where: baseWhere }),
      ]);

      const domainMessages = messages.map(emailMessagePrismaToDomain);
      const nextCursor = useCursor
        ? (messages.length === limit
          ? encodeCursor(messages[messages.length - 1].receivedAt, messages[messages.length - 1].id)
          : null)
        : undefined;

      return {
        messages: domainMessages,
        total,
        nextCursor,
      };
    }

    // Full-text search path (raw SQL)
    const paramsList: Array<string | number | boolean | Date> = [
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

    if (params.flagged !== undefined) {
      whereClause += ` AND is_flagged = $${index}`;
      paramsList.push(params.flagged);
      index += 1;
    }

    whereClause += ` AND to_tsvector('simple', COALESCE(subject, '') || ' ' || COALESCE(from_address, '') || ' ' || COALESCE(from_name, '') || ' ' || COALESCE(snippet, '')) @@ websearch_to_tsquery('simple', $${index})`;
    paramsList.push(search);
    index += 1;

    // Base where (without cursor) for COUNT
    const countWhereClause = whereClause;
    const countParams = [...paramsList];

    // Add cursor filter to WHERE if using cursor
    if (useCursor) {
      whereClause += ` AND (received_at < $${index} OR (received_at = $${index} AND id < $${index + 1}))`;
      paramsList.push(cursorData!.receivedAt);
      index += 1;
      paramsList.push(cursorData!.id);
      index += 1;
    }

    const countQuery = `SELECT COUNT(*)::int AS count FROM email_messages ${countWhereClause}`;
    const listQuery = useCursor
      ? `SELECT id, received_at FROM email_messages ${whereClause} ORDER BY received_at DESC, id DESC LIMIT $${index}`
      : `SELECT id, received_at FROM email_messages ${whereClause} ORDER BY received_at DESC, id DESC OFFSET $${index} LIMIT $${index + 1}`;

    const listParams = useCursor
      ? [...paramsList, limit]
      : [...paramsList, skip, limit];

    const [countResult, rows] = await Promise.all([
      prisma.$queryRawUnsafe<{ count: number }[]>(countQuery, ...countParams),
      prisma.$queryRawUnsafe<{ id: string; received_at: Date }[]>(listQuery, ...listParams),
    ]);

    const total = Number(countResult?.[0]?.count ?? 0);
    const ids = rows.map((row) => row.id);

    if (!ids.length) {
      return { messages: [], total, nextCursor: useCursor ? null : undefined };
    }

    const messages = await prisma.emailMessage.findMany({
      where: { id: { in: ids } },
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
    });

    const domainMessages = messages.map(emailMessagePrismaToDomain);
    const lastRow = rows[rows.length - 1];
    const nextCursor = useCursor
      ? (rows.length === limit
        ? encodeCursor(lastRow.received_at, lastRow.id)
        : null)
      : undefined;

    return {
      messages: domainMessages,
      total,
      nextCursor,
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

    const limit = Math.min(params.limit ?? 50, 100);
    const cursorData = params.cursor ? decodeCursor(params.cursor) : null;
    const useCursor = !!cursorData;
    const page = params.page ?? 1;
    const skip = useCursor ? 0 : (page - 1) * limit;

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

    const baseWhere = {
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

    const where = useCursor
      ? {
          ...baseWhere,
          OR: [
            { receivedAt: { lt: cursorData!.receivedAt } },
            { receivedAt: cursorData!.receivedAt, id: { lt: cursorData!.id } },
          ],
        }
      : baseWhere;

    const [messages, total] = await Promise.all([
      prisma.emailMessage.findMany({
        where,
        orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
        ...(useCursor ? {} : { skip }),
        take: limit,
      }),
      prisma.emailMessage.count({ where: baseWhere }),
    ]);

    const domainMessages = messages.map(emailMessagePrismaToDomain);
    const nextCursor = useCursor
      ? (messages.length === limit
        ? encodeCursor(messages[messages.length - 1].receivedAt, messages[messages.length - 1].id)
        : null)
      : undefined;

    return {
      messages: domainMessages,
      total,
      nextCursor,
    };
  }

  async suggestContacts(
    accountIds: string[],
    query: string,
    limit: number,
  ): Promise<Array<{ email: string; name: string | null; frequency: number }>> {
    if (accountIds.length === 0) return [];

    const pattern = `%${query}%`;

    const rows = await prisma.$queryRawUnsafe<
      Array<{ email: string; name: string | null; frequency: number }>
    >(
      `
      SELECT email, name, SUM(frequency)::int AS frequency
      FROM (
        -- From addresses (received emails)
        SELECT from_address AS email, from_name AS name, COUNT(*)::int AS frequency
        FROM email_messages
        WHERE account_id = ANY($1::uuid[])
          AND deleted_at IS NULL
          AND (from_address ILIKE $2 OR from_name ILIKE $2)
        GROUP BY from_address, from_name

        UNION ALL

        -- To addresses (sent emails)
        SELECT addr AS email, NULL AS name, COUNT(*)::int AS frequency
        FROM email_messages, unnest(to_addresses) AS addr
        WHERE account_id = ANY($1::uuid[])
          AND deleted_at IS NULL
          AND addr ILIKE $2
        GROUP BY addr

        UNION ALL

        -- CC addresses
        SELECT addr AS email, NULL AS name, COUNT(*)::int AS frequency
        FROM email_messages, unnest(cc_addresses) AS addr
        WHERE account_id = ANY($1::uuid[])
          AND deleted_at IS NULL
          AND addr ILIKE $2
        GROUP BY addr
      ) AS contacts
      GROUP BY email, name
      ORDER BY frequency DESC
      LIMIT $3
      `,
      accountIds,
      pattern,
      limit,
    );

    return rows;
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
