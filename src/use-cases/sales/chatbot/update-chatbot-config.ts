import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ChatbotConfigDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import { chatbotConfigToDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import type { ChatbotConfigsRepository } from '@/repositories/sales/chatbot-configs-repository';

interface UpdateChatbotConfigUseCaseRequest {
  tenantId: string;
  greeting?: string;
  autoReplyMessage?: string | null;
  assignToUserId?: string | null;
  formId?: string | null;
  primaryColor?: string;
  isActive?: boolean;
}

interface UpdateChatbotConfigUseCaseResponse {
  chatbotConfig: ChatbotConfigDTO;
}

export class UpdateChatbotConfigUseCase {
  constructor(private chatbotConfigsRepository: ChatbotConfigsRepository) {}

  async execute(
    input: UpdateChatbotConfigUseCaseRequest,
  ): Promise<UpdateChatbotConfigUseCaseResponse> {
    if (input.greeting !== undefined && input.greeting.trim().length === 0) {
      throw new BadRequestError('Greeting message cannot be empty.');
    }

    if (input.greeting && input.greeting.length > 500) {
      throw new BadRequestError(
        'Greeting message cannot exceed 500 characters.',
      );
    }

    if (
      input.primaryColor !== undefined &&
      !/^#[0-9A-Fa-f]{6}$/.test(input.primaryColor)
    ) {
      throw new BadRequestError(
        'Primary color must be a valid hex color (e.g., #6366f1).',
      );
    }

    const chatbotConfig = await this.chatbotConfigsRepository.upsert({
      tenantId: input.tenantId,
      greeting: input.greeting?.trim(),
      autoReplyMessage: input.autoReplyMessage,
      assignToUserId: input.assignToUserId,
      formId: input.formId,
      primaryColor: input.primaryColor,
      isActive: input.isActive,
    });

    return {
      chatbotConfig: chatbotConfigToDTO(chatbotConfig),
    };
  }
}
