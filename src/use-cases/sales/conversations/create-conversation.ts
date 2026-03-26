import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ConversationDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import { conversationToDTO } from '@/mappers/sales/conversation/conversation-to-dto';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';

interface CreateConversationUseCaseRequest {
  tenantId: string;
  customerId: string;
  subject: string;
  createdBy: string;
}

interface CreateConversationUseCaseResponse {
  conversation: ConversationDTO;
}

export class CreateConversationUseCase {
  constructor(private conversationsRepository: ConversationsRepository) {}

  async execute(
    input: CreateConversationUseCaseRequest,
  ): Promise<CreateConversationUseCaseResponse> {
    if (!input.subject || input.subject.trim().length === 0) {
      throw new BadRequestError('Conversation subject is required.');
    }

    if (input.subject.length > 500) {
      throw new BadRequestError(
        'Conversation subject cannot exceed 500 characters.',
      );
    }

    if (!input.customerId) {
      throw new BadRequestError('Customer ID is required.');
    }

    const conversation = await this.conversationsRepository.create({
      tenantId: input.tenantId,
      customerId: input.customerId,
      subject: input.subject.trim(),
      createdBy: input.createdBy,
    });

    return {
      conversation: conversationToDTO(conversation),
    };
  }
}
