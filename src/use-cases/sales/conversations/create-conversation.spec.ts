import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryConversationsRepository } from '@/repositories/sales/in-memory/in-memory-conversations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateConversationUseCase } from './create-conversation';

let conversationsRepository: InMemoryConversationsRepository;
let createConversation: CreateConversationUseCase;

describe('CreateConversationUseCase', () => {
  beforeEach(() => {
    conversationsRepository = new InMemoryConversationsRepository();
    createConversation = new CreateConversationUseCase(conversationsRepository);
  });

  it('should be able to create a conversation', async () => {
    const result = await createConversation.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: 'Inquiry about product',
      createdBy: 'user-1',
    });

    expect(result.conversation).toBeDefined();
    expect(result.conversation.subject).toBe('Inquiry about product');
    expect(result.conversation.status).toBe('OPEN');
    expect(result.conversation.isActive).toBe(true);
  });

  it('should trim the subject', async () => {
    const result = await createConversation.execute({
      tenantId: 'tenant-1',
      customerId: 'customer-1',
      subject: '  Spaced subject  ',
      createdBy: 'user-1',
    });

    expect(result.conversation.subject).toBe('Spaced subject');
  });

  it('should not allow empty subject', async () => {
    await expect(() =>
      createConversation.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        subject: '',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(() =>
      createConversation.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        subject: '   ',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow subject exceeding 500 characters', async () => {
    await expect(() =>
      createConversation.execute({
        tenantId: 'tenant-1',
        customerId: 'customer-1',
        subject: 'A'.repeat(501),
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow missing customer ID', async () => {
    await expect(() =>
      createConversation.execute({
        tenantId: 'tenant-1',
        customerId: '',
        subject: 'Test',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
