import { MessagingContact } from '@/entities/messaging/messaging-contact';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import { MessagingChannel as PrismaMessagingChannel } from '@prisma/generated/client.js';
import type {
  MessagingContactsRepository,
  ListContactsParams,
  ListContactsResult,
} from '../messaging-contacts-repository';

function toDomain(raw: Record<string, unknown>): MessagingContact {
  return MessagingContact.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId as string),
      accountId: new UniqueEntityID(raw.accountId as string),
      channel: raw.channel as MessagingChannel,
      externalId: raw.externalId as string,
      name: (raw.name as string) ?? null,
      username: (raw.username as string) ?? null,
      avatarUrl: (raw.avatarUrl as string) ?? null,
      customerId: raw.customerId
        ? new UniqueEntityID(raw.customerId as string)
        : null,
      lastMessageAt: (raw.lastMessageAt as Date) ?? null,
      unreadCount: raw.unreadCount as number,
      isBlocked: raw.isBlocked as boolean,
      metadata: (raw.metadata as Record<string, unknown>) ?? null,
      createdAt: raw.createdAt as Date,
      updatedAt: raw.updatedAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaMessagingContactsRepository
  implements MessagingContactsRepository
{
  async findById(id: string): Promise<MessagingContact | null> {
    const contactRecord = await prisma.messagingContact.findUnique({
      where: { id },
    });

    return contactRecord
      ? toDomain(contactRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByAccountAndExternalId(
    accountId: string,
    externalId: string,
  ): Promise<MessagingContact | null> {
    const contactRecord = await prisma.messagingContact.findUnique({
      where: {
        accountId_externalId: { accountId, externalId },
      },
    });

    return contactRecord
      ? toDomain(contactRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByTenantId(
    tenantId: string,
    params: ListContactsParams,
  ): Promise<ListContactsResult> {
    const { page, limit, channel, search } = params;

    const where: Prisma.MessagingContactWhereInput = { tenantId };

    if (channel) {
      where.channel = channel as unknown as PrismaMessagingChannel;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { externalId: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [contactRecords, total] = await Promise.all([
      prisma.messagingContact.findMany({
        where,
        orderBy: { lastMessageAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.messagingContact.count({ where }),
    ]);

    const contacts = contactRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );

    return { contacts, total };
  }

  async create(contact: MessagingContact): Promise<void> {
    await prisma.messagingContact.create({
      data: {
        id: contact.id.toString(),
        tenantId: contact.tenantId.toString(),
        accountId: contact.accountId.toString(),
        channel: contact.channel as unknown as PrismaMessagingChannel,
        externalId: contact.externalId,
        name: contact.name,
        username: contact.username,
        avatarUrl: contact.avatarUrl,
        customerId: contact.customerId?.toString() ?? null,
        lastMessageAt: contact.lastMessageAt,
        unreadCount: contact.unreadCount,
        isBlocked: contact.isBlocked,
        metadata:
          (contact.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        createdAt: contact.createdAt,
        updatedAt: contact.updatedAt,
      },
    });
  }

  async save(contact: MessagingContact): Promise<void> {
    await prisma.messagingContact.update({
      where: { id: contact.id.toString() },
      data: {
        name: contact.name,
        username: contact.username,
        avatarUrl: contact.avatarUrl,
        customerId: contact.customerId?.toString() ?? null,
        lastMessageAt: contact.lastMessageAt,
        unreadCount: contact.unreadCount,
        isBlocked: contact.isBlocked,
        metadata:
          (contact.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
      },
    });
  }
}
