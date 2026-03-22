import type { AiConversationsRepository } from '@/repositories/ai/ai-conversations-repository';

interface ListConversationsRequest {
  tenantId: string;
  userId: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class ListConversationsUseCase {
  constructor(private conversationsRepository: AiConversationsRepository) {}

  async execute(request: ListConversationsRequest) {
    const page = request.page ?? 1;
    const limit = Math.min(request.limit ?? 20, 100);

    const { conversations, total } =
      await this.conversationsRepository.findMany({
        tenantId: request.tenantId,
        userId: request.userId,
        status: request.status,
        search: request.search,
        page,
        limit,
      });

    return {
      conversations: conversations.map((c) => ({
        id: c.id.toString(),
        tenantId: c.tenantId.toString(),
        userId: c.userId.toString(),
        title: c.title,
        status: c.status,
        context: c.context,
        contextModule: c.contextModule,
        messageCount: c.messageCount,
        lastMessageAt: c.lastMessageAt,
        isPinned: c.isPinned,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
