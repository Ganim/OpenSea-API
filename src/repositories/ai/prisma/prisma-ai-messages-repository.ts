import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AiMessage } from '@/entities/ai/ai-message';
import type {
  AiMessagesRepository,
  CreateMessageSchema,
  FindManyMessagesOptions,
  FindManyMessagesResult,
} from '../ai-messages-repository';
import type {
  AiMessageRole,
  AiMessageContentType,
  AiMessage as PrismaAiMessage,
  Prisma,
} from '@prisma/generated/client.js';

function toDomain(raw: PrismaAiMessage): AiMessage {
  return AiMessage.create(
    {
      conversationId: new UniqueEntityID(raw.conversationId),
      role: raw.role,
      content: raw.content,
      contentType: raw.contentType,
      renderData: raw.renderData as Record<string, unknown> | null,
      attachments: raw.attachments as Record<string, unknown> | null,
      aiTier: raw.aiTier,
      aiModel: raw.aiModel,
      aiTokensInput: raw.aiTokensInput,
      aiTokensOutput: raw.aiTokensOutput,
      aiLatencyMs: raw.aiLatencyMs,
      aiCost: raw.aiCost ? Number(raw.aiCost) : null,
      toolCalls: raw.toolCalls as Record<string, unknown> | null,
      actionsTaken: raw.actionsTaken as Record<string, unknown> | null,
      audioUrl: raw.audioUrl,
      transcription: raw.transcription,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaAiMessagesRepository implements AiMessagesRepository {
  async create(data: CreateMessageSchema): Promise<AiMessage> {
    const raw = await prisma.aiMessage.create({
      data: {
        conversationId: data.conversationId,
        role: data.role as AiMessageRole,
        content: data.content,
        contentType: (data.contentType as AiMessageContentType) ?? 'TEXT',
        renderData: (data.renderData as Prisma.InputJsonValue) ?? undefined,
        attachments: (data.attachments as Prisma.InputJsonValue) ?? undefined,
        aiTier: data.aiTier,
        aiModel: data.aiModel,
        aiTokensInput: data.aiTokensInput,
        aiTokensOutput: data.aiTokensOutput,
        aiLatencyMs: data.aiLatencyMs,
        aiCost: data.aiCost,
        toolCalls: (data.toolCalls as Prisma.InputJsonValue) ?? undefined,
        actionsTaken: (data.actionsTaken as Prisma.InputJsonValue) ?? undefined,
        audioUrl: data.audioUrl,
        transcription: data.transcription,
      },
    });

    return toDomain(raw);
  }

  async findMany(
    options: FindManyMessagesOptions,
  ): Promise<FindManyMessagesResult> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 50, 100);
    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      prisma.aiMessage.findMany({
        where: { conversationId: options.conversationId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      prisma.aiMessage.count({
        where: { conversationId: options.conversationId },
      }),
    ]);

    return {
      messages: messages.map(toDomain),
      total,
    };
  }
}
