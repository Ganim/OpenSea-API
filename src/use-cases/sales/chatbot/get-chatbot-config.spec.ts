import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ChatbotConfig } from '@/entities/sales/chatbot-config';
import { InMemoryChatbotConfigsRepository } from '@/repositories/sales/in-memory/in-memory-chatbot-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetChatbotConfigUseCase } from './get-chatbot-config';

let chatbotConfigsRepository: InMemoryChatbotConfigsRepository;
let getChatbotConfig: GetChatbotConfigUseCase;

describe('GetChatbotConfigUseCase', () => {
  beforeEach(() => {
    chatbotConfigsRepository = new InMemoryChatbotConfigsRepository();
    getChatbotConfig = new GetChatbotConfigUseCase(chatbotConfigsRepository);
  });

  it('should return chatbot config for a tenant', async () => {
    const tenantId = 'tenant-1';
    const config = ChatbotConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      greeting: 'Welcome!',
      primaryColor: '#ff5733',
      isActive: true,
    });
    chatbotConfigsRepository.items.push(config);

    const result = await getChatbotConfig.execute({ tenantId });

    expect(result.chatbotConfig).toBeDefined();
    expect(result.chatbotConfig!.greeting).toBe('Welcome!');
    expect(result.chatbotConfig!.primaryColor).toBe('#ff5733');
    expect(result.chatbotConfig!.isActive).toBe(true);
  });

  it('should return null when no config exists', async () => {
    const result = await getChatbotConfig.execute({
      tenantId: 'nonexistent-tenant',
    });

    expect(result.chatbotConfig).toBeNull();
  });
});
