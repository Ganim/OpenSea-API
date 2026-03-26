import { MessagingMessage } from '@/entities/messaging/messaging-message';
import type { MessagingChannel } from '@/entities/messaging/messaging-channel.enum';
import type { MessagingDirection } from '@/entities/messaging/messaging-direction.enum';
import type { MessagingMessageStatus } from '@/entities/messaging/messaging-message-status.enum';
import type { MessagingMessageType } from '@/entities/messaging/messaging-message-type.enum';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import {
  MessagingChannel as PrismaMessagingChannel,
  MessagingDirection as PrismaMessagingDirection,
  MessagingMessageType as PrismaMessagingMessageType,
  MessagingMessageStatus as PrismaMessagingMessageStatus,
} from '@prisma/generated/client.js';
import type {
  MessagingMessagesRepository,
  ListMessagesParams,
  ListMessagesResult,
} from '../messaging-messages-repository';

function toDomain(raw: Record<string, unknown>): MessagingMessage {
  return MessagingMessage.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId as string),
      accountId: new UniqueEntityID(raw.accountId as string),
      contactId: new UniqueEntityID(raw.contactId as string),
      channel: raw.channel as MessagingChannel,
      direction: raw.direction as MessagingDirection,
      type: raw.type as MessagingMessageType,
      status: raw.status as MessagingMessageStatus,
      text: (raw.text as string) ?? null,
      mediaUrl: (raw.mediaUrl as string) ?? null,
      mediaType: (raw.mediaType as string) ?? null,
      fileName: (raw.fileName as string) ?? null,
      templateName: (raw.templateName as string) ?? null,
      templateParams: (raw.templateParams as Record<string, string>) ?? null,
      externalId: (raw.externalId as string) ?? null,
      replyToMessageId: raw.replyToMessageId
        ? new UniqueEntityID(raw.replyToMessageId as string)
        : null,
      errorCode: (raw.errorCode as string) ?? null,
      errorMessage: (raw.errorMessage as string) ?? null,
      metadata: (raw.metadata as Record<string, unknown>) ?? null,
      sentAt: (raw.sentAt as Date) ?? null,
      deliveredAt: (raw.deliveredAt as Date) ?? null,
      readAt: (raw.readAt as Date) ?? null,
      createdAt: raw.createdAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaMessagingMessagesRepository
  implements MessagingMessagesRepository
{
  async findById(id: string): Promise<MessagingMessage | null> {
    const messageRecord = await prisma.messagingMessage.findUnique({
      where: { id },
    });

    return messageRecord
      ? toDomain(messageRecord as unknown as Record<string, unknown>)
      : null;
  }

  async findByContactId(
    contactId: string,
    params: ListMessagesParams,
  ): Promise<ListMessagesResult> {
    const { page, limit } = params;

    const where: Prisma.MessagingMessageWhereInput = { contactId };

    const [messageRecords, total] = await Promise.all([
      prisma.messagingMessage.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.messagingMessage.count({ where }),
    ]);

    const messages = messageRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );

    return { messages, total };
  }

  async findByExternalId(externalId: string): Promise<MessagingMessage | null> {
    const messageRecord = await prisma.messagingMessage.findFirst({
      where: { externalId },
    });

    return messageRecord
      ? toDomain(messageRecord as unknown as Record<string, unknown>)
      : null;
  }

  async create(message: MessagingMessage): Promise<void> {
    await prisma.messagingMessage.create({
      data: {
        id: message.id.toString(),
        tenantId: message.tenantId.toString(),
        accountId: message.accountId.toString(),
        contactId: message.contactId.toString(),
        channel: message.channel as unknown as PrismaMessagingChannel,
        direction: message.direction as unknown as PrismaMessagingDirection,
        type: message.type as unknown as PrismaMessagingMessageType,
        status: message.status as unknown as PrismaMessagingMessageStatus,
        text: message.text,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        fileName: message.fileName,
        templateName: message.templateName,
        templateParams:
          (message.templateParams as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        externalId: message.externalId,
        replyToMessageId: message.replyToMessageId?.toString() ?? null,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        metadata:
          (message.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
        createdAt: message.createdAt,
      },
    });
  }

  async save(message: MessagingMessage): Promise<void> {
    await prisma.messagingMessage.update({
      where: { id: message.id.toString() },
      data: {
        status: message.status as unknown as PrismaMessagingMessageStatus,
        externalId: message.externalId,
        errorCode: message.errorCode,
        errorMessage: message.errorMessage,
        sentAt: message.sentAt,
        deliveredAt: message.deliveredAt,
        readAt: message.readAt,
      },
    });
  }
}
