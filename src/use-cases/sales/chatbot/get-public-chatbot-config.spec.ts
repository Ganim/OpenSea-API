import { InMemoryChatbotConfigsRepository } from '@/repositories/sales/in-memory/in-memory-chatbot-configs-repository';
import { ChatbotConfig } from '@/entities/sales/chatbot-config';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPublicChatbotConfigUseCase } from './get-public-chatbot-config';

let chatbotConfigsRepository: InMemoryChatbotConfigsRepository;
let sut: GetPublicChatbotConfigUseCase;

describe('GetPublicChatbotConfigUseCase', () => {
  beforeEach(() => {
    chatbotConfigsRepository = new InMemoryChatbotConfigsRepository();
    sut = new GetPublicChatbotConfigUseCase(chatbotConfigsRepository);
  });

  it('should return public chatbot config for a valid tenant slug', async () => {
    const config = ChatbotConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      greeting: 'Hello!',
      primaryColor: '#6366f1',
      isActive: true,
    });
    chatbotConfigsRepository.items.push(config);
    chatbotConfigsRepository.tenantSlugs.set('my-store', 'tenant-1');

    const result = await sut.execute({ tenantSlug: 'my-store' });

    expect(result.config).toBeTruthy();
    expect(result.config.greeting).toBe('Hello!');
    expect(result.config.primaryColor).toBe('#6366f1');
  });

  it('should throw if tenant slug is not found', async () => {
    await expect(sut.execute({ tenantSlug: 'non-existent' })).rejects.toThrow(
      'Chatbot is not available.',
    );
  });

  it('should throw if chatbot is inactive', async () => {
    const config = ChatbotConfig.create({
      tenantId: new UniqueEntityID('tenant-1'),
      greeting: 'Hello!',
      primaryColor: '#6366f1',
      isActive: false,
    });
    chatbotConfigsRepository.items.push(config);
    chatbotConfigsRepository.tenantSlugs.set('my-store', 'tenant-1');

    await expect(sut.execute({ tenantSlug: 'my-store' })).rejects.toThrow(
      'Chatbot is not available.',
    );
  });
});
