import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryChatbotConfigsRepository } from '@/repositories/sales/in-memory/in-memory-chatbot-configs-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateChatbotConfigUseCase } from './update-chatbot-config';

let chatbotConfigsRepository: InMemoryChatbotConfigsRepository;
let updateChatbotConfig: UpdateChatbotConfigUseCase;

describe('UpdateChatbotConfigUseCase', () => {
  beforeEach(() => {
    chatbotConfigsRepository = new InMemoryChatbotConfigsRepository();
    updateChatbotConfig = new UpdateChatbotConfigUseCase(
      chatbotConfigsRepository,
    );
  });

  it('should create chatbot config when none exists', async () => {
    const result = await updateChatbotConfig.execute({
      tenantId: 'tenant-1',
      greeting: 'Hello!',
      primaryColor: '#6366f1',
      isActive: true,
    });

    expect(result.chatbotConfig).toBeDefined();
    expect(result.chatbotConfig.greeting).toBe('Hello!');
    expect(result.chatbotConfig.isActive).toBe(true);
  });

  it('should update existing chatbot config', async () => {
    await updateChatbotConfig.execute({
      tenantId: 'tenant-1',
      greeting: 'Hello!',
      isActive: false,
    });

    const result = await updateChatbotConfig.execute({
      tenantId: 'tenant-1',
      greeting: 'Updated greeting',
      isActive: true,
    });

    expect(result.chatbotConfig.greeting).toBe('Updated greeting');
    expect(result.chatbotConfig.isActive).toBe(true);
  });

  it('should reject empty greeting', async () => {
    await expect(() =>
      updateChatbotConfig.execute({
        tenantId: 'tenant-1',
        greeting: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject greeting exceeding 500 characters', async () => {
    await expect(() =>
      updateChatbotConfig.execute({
        tenantId: 'tenant-1',
        greeting: 'A'.repeat(501),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reject invalid hex color', async () => {
    await expect(() =>
      updateChatbotConfig.execute({
        tenantId: 'tenant-1',
        primaryColor: 'not-a-color',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should accept valid hex color', async () => {
    const result = await updateChatbotConfig.execute({
      tenantId: 'tenant-1',
      primaryColor: '#ff5733',
    });

    expect(result.chatbotConfig.primaryColor).toBe('#ff5733');
  });
});
