import type { ConversationDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import { conversationToDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface ListConversationsUseCaseRequest {
  tenantId: string;
  page?: number;
  perPage?: number;
  status?: 'OPEN' | 'CLOSED' | 'ARCHIVED';
}

interface ListConversationsUseCaseResponse {
  conversations: ConversationDTO[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export class ListConversationsUseCase {
  constructor(private conversationsRepository: ConversationsRepository) {}

  async execute(
    input: ListConversationsUseCaseRequest,
  ): Promise<ListConversationsUseCaseResponse> {
    const page = input.page ?? 1;
    const perPage = input.perPage ?? 20;

    const [conversations, total] = await Promise.all([
      this.conversationsRepository.findMany(
        page,
        perPage,
        input.tenantId,
        input.status,
      ),
      this.conversationsRepository.countByTenant(
        input.tenantId,
        input.status,
      ),
    ]);

    return {
      conversations: conversations.map((conversation) =>
        conversationToDTO(conversation),
      ),
      total,
      page,
      perPage,
      totalPages: Math.ceil(total / perPage),
    };
  }
}
