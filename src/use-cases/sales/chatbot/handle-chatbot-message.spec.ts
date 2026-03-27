import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChatbotConfig } from '@/entities/sales/chatbot-config';
import { InMemoryChatbotConfigsRepository } from '@/repositories/sales/in-memory/in-memory-chatbot-configs-repository';
import { InMemoryConversationMessagesRepository } from '@/repositories/sales/in-memory/in-memory-conversation-messages-repository';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { InMemoryCustomersRepository } from '@/repositories/sales/in-memory/in-memory-customers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { HandleChatbotMessageUseCase } from './handle-chatbot-message';

let chatbotConfigsRepository: InMemoryChatbotConfigsRepository;
let conversationsRepository: InMemoryConversationsRepository;
let conversationMessagesRepository: InMemoryConversationMessagesRepository;
let customersRepository: InMemoryCustomersRepository;
let handleChatbotMessage: HandleChatbotMessageUseCase;

const TENANT_ID = 'tenant-1';
const TENANT_SLUG = 'demo-company';

describe('HandleChatbotMessageUseCase', () => {
  beforeEach(() => {
    chatbotConfigsRepository = new InMemoryChatbotConfigsRepository();
    conversationsRepository = new InMemoryConversationsRepository();
    conversationMessagesRepository =
      new InMemoryConversationMessagesRepository();
    customersRepository = new InMemoryCustomersRepository();

    handleChatbotMessage = new HandleChatbotMessageUseCase(
      chatbotConfigsRepository,
      conversationsRepository,
      conversationMessagesRepository,
      customersRepository,
    );

    // Set up chatbot config
    const config = ChatbotConfig.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      greeting: 'Welcome!',
      autoReplyMessage:
        'Thank you for your message. We will get back to you soon.',
      primaryColor: '#6366f1',
      isActive: true,
    });
    chatbotConfigsRepository.items.push(config);
    chatbotConfigsRepository.tenantSlugs.set(TENANT_SLUG, TENANT_ID);
  });

  it('should handle a chatbot message and create conversation', async () => {
    const result = await handleChatbotMessage.execute({
      tenantSlug: TENANT_SLUG,
      name: 'John Doe',
      email: 'john@example.com',
      message: 'I have a question about your product',
    });

    expect(result.conversationId).toBeDefined();
    expect(result.userMessage.content).toBe(
      'I have a question about your product',
    );
    expect(result.userMessage.senderType).toBe('CUSTOMER');
    expect(result.config.greeting).toBe('Welcome!');
  });

  it('should include auto-reply when configured', async () => {
    const result = await handleChatbotMessage.execute({
      tenantSlug: TENANT_SLUG,
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there',
    });

    expect(result.autoReply).toBeDefined();
    expect(result.autoReply!.content).toBe(
      'Thank you for your message. We will get back to you soon.',
    );
    expect(result.autoReply!.senderType).toBe('SYSTEM');
  });

  it('should throw when chatbot is not available', async () => {
    await expect(() =>
      handleChatbotMessage.execute({
        tenantSlug: 'nonexistent-slug',
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when chatbot is inactive', async () => {
    chatbotConfigsRepository.items[0].isActive = false;

    await expect(() =>
      handleChatbotMessage.execute({
        tenantSlug: TENANT_SLUG,
        name: 'John',
        email: 'john@example.com',
        message: 'Hello',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when name is empty', async () => {
    await expect(() =>
      handleChatbotMessage.execute({
        tenantSlug: TENANT_SLUG,
        name: '',
        email: 'john@example.com',
        message: 'Hello',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when email is empty', async () => {
    await expect(() =>
      handleChatbotMessage.execute({
        tenantSlug: TENANT_SLUG,
        name: 'John',
        email: '',
        message: 'Hello',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when message is empty', async () => {
    await expect(() =>
      handleChatbotMessage.execute({
        tenantSlug: TENANT_SLUG,
        name: 'John',
        email: 'john@example.com',
        message: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
