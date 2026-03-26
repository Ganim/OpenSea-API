import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { Conversation } from '@/entities/sales/conversation';
import { prisma } from '@/lib/prisma';
import type { ConversationStatus } from '@prisma/generated/client.js';
import type {
  ConversationsRepository,
  CreateConversationSchema,
} from '../conversations-repository';

function mapToDomain(data: Record<string, unknown>): Conversation {
  return Conversation.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      customerId: new EntityID(data.customerId as string),
      subject: data.subject as string,
      status: data.status as 'OPEN' | 'CLOSED' | 'ARCHIVED',
      lastMessageAt: (data.lastMessageAt as Date) ?? undefined,
      createdBy: data.createdBy as string,
      isActive: data.isActive as boolean,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaConversationsRepository
  implements ConversationsRepository
{
  async create(data: CreateConversationSchema): Promise<Conversation> {
    const conversationData = await prisma.conversation.create({
      data: {
        tenantId: data.tenantId,
        customerId: data.customerId,
        subject: data.subject,
        createdBy: data.createdBy,
        status: (data.status ?? 'OPEN') as ConversationStatus,
      },
    });

    return mapToDomain(conversationData as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Conversation | null> {
    const conversationData = await prisma.conversation.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!conversationData) return null;

    return mapToDomain(conversationData as unknown as Record<string, unknown>);
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<Conversation[]> {
    const conversationsData = await prisma.conversation.findMany({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as ConversationStatus }),
      },
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return conversationsData.map((conversationData) =>
      mapToDomain(conversationData as unknown as Record<string, unknown>),
    );
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return prisma.conversation.count({
      where: {
        tenantId,
        deletedAt: null,
        ...(status && { status: status as ConversationStatus }),
      },
    });
  }

  async save(conversation: Conversation): Promise<void> {
    await prisma.conversation.update({
      where: { id: conversation.id.toString() },
      data: {
        subject: conversation.subject,
        status: conversation.status as ConversationStatus,
        lastMessageAt: conversation.lastMessageAt,
        isActive: conversation.isActive,
        deletedAt: conversation.deletedAt,
      },
    });
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.conversation.update({
      where: {
        id: id.toString(),
        tenantId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }
}
