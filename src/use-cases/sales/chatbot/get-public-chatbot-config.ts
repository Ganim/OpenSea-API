import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { ChatbotPublicConfigDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import { chatbotConfigToPublicDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import type { ChatbotConfigsRepository } from '@/repositories/sales/chatbot-configs-repository';

interface GetPublicChatbotConfigUseCaseRequest {
  tenantSlug: string;
}

interface GetPublicChatbotConfigUseCaseResponse {
  config: ChatbotPublicConfigDTO;
}

export class GetPublicChatbotConfigUseCase {
  constructor(private chatbotConfigsRepository: ChatbotConfigsRepository) {}

  async execute(
    input: GetPublicChatbotConfigUseCaseRequest,
  ): Promise<GetPublicChatbotConfigUseCaseResponse> {
    const chatbotConfig = await this.chatbotConfigsRepository.findByTenantSlug(
      input.tenantSlug,
    );

    if (!chatbotConfig || !chatbotConfig.isActive) {
      throw new ResourceNotFoundError('Chatbot is not available.');
    }

    return {
      config: chatbotConfigToPublicDTO(chatbotConfig),
    };
  }
}
