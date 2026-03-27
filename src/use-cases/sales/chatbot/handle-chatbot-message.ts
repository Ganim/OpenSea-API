import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { ChatbotPublicConfigDTO } from '@/mappers/sales/chatbot/chatbot-config-to-dto';
import type { ConversationMessageDTO } from '@/mappers/sales/conversation/conversation-message-to-dto';
import { conversationMessageToDTO } from '@/mappers/sales/conversation/conversation-message-to-dto';
import type { ChatbotConfigsRepository } from '@/repositories/sales/chatbot-configs-repository';
import type { ConversationMessagesRepository } from '@/repositories/sales/conversation-messages-repository';
import type { ConversationsRepository } from '@/repositories/sales/conversations-repository';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import { CustomerType } from '@/entities/sales/value-objects/customer-type';

interface HandleChatbotMessageUseCaseRequest {
  tenantSlug: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
}

interface HandleChatbotMessageUseCaseResponse {
  conversationId: string;
  userMessage: ConversationMessageDTO;
  autoReply?: ConversationMessageDTO;
  config: ChatbotPublicConfigDTO;
}

export class HandleChatbotMessageUseCase {
  constructor(
    private chatbotConfigsRepository: ChatbotConfigsRepository,
    private conversationsRepository: ConversationsRepository,
    private conversationMessagesRepository: ConversationMessagesRepository,
    private customersRepository: CustomersRepository,
  ) {}

  async execute(
    input: HandleChatbotMessageUseCaseRequest,
  ): Promise<HandleChatbotMessageUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Name is required.');
    }

    if (!input.email || input.email.trim().length === 0) {
      throw new BadRequestError('Email is required.');
    }

    if (!input.message || input.message.trim().length === 0) {
      throw new BadRequestError('Message is required.');
    }

    const chatbotConfig = await this.chatbotConfigsRepository.findByTenantSlug(
      input.tenantSlug,
    );

    if (!chatbotConfig || !chatbotConfig.isActive) {
      throw new ResourceNotFoundError('Chatbot is not available.');
    }

    const tenantId = chatbotConfig.tenantId.toString();

    // Find or create customer
    let customer = await this.customersRepository.findByEmail(
      input.email.trim().toLowerCase(),
      tenantId,
    );

    if (!customer) {
      customer = await this.customersRepository.create({
        tenantId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        phone: input.phone?.trim(),
        type: CustomerType.INDIVIDUAL(),
      });
    }

    // Create conversation
    const conversation = await this.conversationsRepository.create({
      tenantId,
      customerId: customer.id.toString(),
      subject: `Chatbot: ${input.name.trim()}`,
      createdBy: 'chatbot',
    });

    // Save visitor message
    const visitorMessage = await this.conversationMessagesRepository.create({
      conversationId: conversation.id.toString(),
      senderName: input.name.trim(),
      senderType: 'CUSTOMER',
      content: input.message.trim(),
    });

    conversation.lastMessageAt = new Date();
    await this.conversationsRepository.save(conversation);

    const response: HandleChatbotMessageUseCaseResponse = {
      conversationId: conversation.id.toString(),
      userMessage: conversationMessageToDTO(visitorMessage),
      config: {
        greeting: chatbotConfig.greeting,
        primaryColor: chatbotConfig.primaryColor,
      },
    };

    // Send auto-reply if configured
    if (chatbotConfig.autoReplyMessage) {
      const autoReplyMessage = await this.conversationMessagesRepository.create(
        {
          conversationId: conversation.id.toString(),
          senderName: 'Chatbot',
          senderType: 'SYSTEM',
          content: chatbotConfig.autoReplyMessage,
        },
      );

      response.autoReply = conversationMessageToDTO(autoReplyMessage);
    }

    return response;
  }
}
