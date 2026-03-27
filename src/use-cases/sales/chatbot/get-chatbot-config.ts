import type { ChatbotConfigDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import { chatbotConfigToDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import type { ChatbotConfigsRepository } from '@/repositories/sales/chatbot-configs-repository';

interface GetChatbotConfigUseCaseRequest {
  tenantId: string;
}

interface GetChatbotConfigUseCaseResponse {
  chatbotConfig: ChatbotConfigDTO | null;
}

export class GetChatbotConfigUseCase {
  constructor(private chatbotConfigsRepository: ChatbotConfigsRepository) {}

  async execute(
    input: GetChatbotConfigUseCaseRequest,
  ): Promise<GetChatbotConfigUseCaseResponse> {
    const chatbotConfig = await this.chatbotConfigsRepository.findByTenantId(
      input.tenantId,
    );

    return {
      chatbotConfig: chatbotConfig ? chatbotConfigToDTO(chatbotConfig) : null,
    };
  }
}
