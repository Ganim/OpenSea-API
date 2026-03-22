import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AiConversation } from '@/entities/ai/ai-conversation';
import type {
  AiConversationsRepository,
  CreateConversationSchema,
  FindManyConversationsOptions,
  FindManyConversationsResult,
} from '../ai-conversations-repository';
import type {
  AiConversationContext,
  AiConversationStatus,
  Prisma,
} from '@prisma/generated/client.js';

function toDomain(raw: {
  id: string;
  tenantId: string;
  userId: string;
  title: string | null;
  status: string;
  context: string;
  contextModule: string | null;
  contextEntityType: string | null;
  contextEntityId: string | null;
  messageCount: number;
  lastMessageAt: Date | null;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}): AiConversation {
  return AiConversation.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      userId: new UniqueEntityID(raw.userId),
      title: raw.title,
      status: raw.status,
      context: raw.context,
      contextModule: raw.contextModule,
      contextEntityType: raw.contextEntityType,
      contextEntityId: raw.contextEntityId,
      messageCount: raw.messageCount,
      lastMessageAt: raw.lastMessageAt,
      isPinned: raw.isPinned,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaAiConversationsRepository
  implements AiConversationsRepository
{
  async create(data: CreateConversationSchema): Promise<AiConversation> {
    const raw = await prisma.aiConversation.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId,
        title: data.title,
        context: (data.context as AiConversationContext) ?? 'DEDICATED',
        contextModule: data.contextModule,
        contextEntityType: data.contextEntityType,
        contextEntityId: data.contextEntityId,
      },
    });

    return toDomain(raw);
  }

  async findById(id: string, tenantId: string): Promise<AiConversation | null> {
    const raw = await prisma.aiConversation.findFirst({
      where: { id, tenantId },
    });

    if (!raw) return null;
    return toDomain(raw);
  }

  async findMany(
    options: FindManyConversationsOptions,
  ): Promise<FindManyConversationsResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.AiConversationWhereInput = {
      tenantId: options.tenantId,
      userId: options.userId,
    };

    if (options.status) {
      where.status = options.status as AiConversationStatus;
    }

    if (options.search) {
      where.title = { contains: options.search, mode: 'insensitive' };
    }

    const [conversations, total] = await Promise.all([
      prisma.aiConversation.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.aiConversation.count({ where }),
    ]);

    return {
      conversations: conversations.map(toDomain),
      total,
    };
  }

  async archive(id: string, tenantId: string): Promise<void> {
    await prisma.aiConversation.update({
      where: { id, tenantId },
      data: { status: 'ARCHIVED' },
    });
  }

  async updateMessageCount(
    id: string,
    count: number,
    lastMessageAt: Date,
  ): Promise<void> {
    await prisma.aiConversation.update({
      where: { id },
      data: { messageCount: count, lastMessageAt },
    });
  }
}
