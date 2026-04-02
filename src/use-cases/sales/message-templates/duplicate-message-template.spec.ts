import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';
import { DuplicateMessageTemplateUseCase } from './duplicate-message-template';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;
let duplicateMessageTemplate: DuplicateMessageTemplateUseCase;

describe('DuplicateMessageTemplateUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(
      messageTemplatesRepository,
    );
    duplicateMessageTemplate = new DuplicateMessageTemplateUseCase(
      messageTemplatesRepository,
    );
  });

  it('should duplicate a message template', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Original Template',
      channel: 'EMAIL',
      subject: 'Hello {{name}}',
      body: 'Welcome {{name}} to our platform!',
      createdBy: 'user-1',
    });

    const result = await duplicateMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      createdBy: 'user-2',
    });

    expect(result.messageTemplate.name).toBe('Original Template (copy)');
    expect(result.messageTemplate.body).toBe(
      'Welcome {{name}} to our platform!',
    );
    expect(result.messageTemplate.channel).toBe('EMAIL');
    expect(result.messageTemplate.isActive).toBe(false);
    expect(result.messageTemplate.createdBy).toBe('user-2');
    expect(result.messageTemplate.id).not.toBe(messageTemplate.id);
  });

  it('should generate unique name when copy already exists', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Template A',
      channel: 'EMAIL',
      body: 'Body A',
      createdBy: 'user-1',
    });

    // First duplicate
    await duplicateMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      createdBy: 'user-1',
    });

    // Second duplicate should get "(copy 2)"
    const result = await duplicateMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      createdBy: 'user-1',
    });

    expect(result.messageTemplate.name).toBe('Template A (copy 2)');
  });

  it('should throw when template not found', async () => {
    await expect(() =>
      duplicateMessageTemplate.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
