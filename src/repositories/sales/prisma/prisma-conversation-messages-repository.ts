import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { ConversationMessage } from '@/entities/sales/conversation-message';
import { prisma } from '@/lib/prisma';
import type {
  ConversationMessagesRepository,
  CreateConversationMessageSchema,
} from '../conversation-messages-repository';

function mapToDomain(data: Record<string, unknown>): ConversationMessage {
  return ConversationMessage.create(
    {
      conversationId: new EntityID(data.conversationId as string),
      senderId: (data.senderId as string) ?? undefined,
      senderName: data.senderName as string,
      senderType: data.senderType as string,
      content: data.content as string,
      sentiment: (data.sentiment as string) ?? undefined,
      readAt: (data.readAt as Date) ?? undefined,
      createdAt: data.createdAt as Date,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaConversationMessagesRepository
  implements ConversationMessagesRepository
{
  async create(
    data: CreateConversationMessageSchema,
  ): Promise<ConversationMessage> {
    const messageData = await prisma.conversationMessage.create({
      data: {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderType: data.senderType ?? 'AGENT',
        content: data.content,
      },
    });

    return mapToDomain(messageData as unknown as Record<string, unknown>);
  }

  async findByConversationId(
    conversationId: UniqueEntityID,
  ): Promise<ConversationMessage[]> {
    const messagesData = await prisma.conversationMessage.findMany({
      where: { conversationId: conversationId.toString() },
      orderBy: { createdAt: 'asc' },
    });

    return messagesData.map((messageData) =>
      mapToDomain(messageData as unknown as Record<string, unknown>),
    );
  }

  async markAsRead(conversationId: UniqueEntityID): Promise<void> {
    await prisma.conversationMessage.updateMany({
      where: {
        conversationId: conversationId.toString(),
        readAt: null,
      },
      data: { readAt: new Date() },
    });
  }

  async save(message: ConversationMessage): Promise<void> {
    await prisma.conversationMessage.update({
      where: { id: message.id.toString() },
      data: {
        sentiment: message.sentiment ?? null,
        readAt: message.readAt,
      },
    });
  }
}
