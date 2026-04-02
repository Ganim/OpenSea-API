import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';
import { DeleteMessageTemplateUseCase } from './delete-message-template';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;
let deleteMessageTemplate: DeleteMessageTemplateUseCase;

describe('DeleteMessageTemplateUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(
      messageTemplatesRepository,
    );
    deleteMessageTemplate = new DeleteMessageTemplateUseCase(
      messageTemplatesRepository,
    );
  });

  it('should soft delete a message template', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'To Delete',
      channel: 'EMAIL',
      body: 'Delete me',
      createdBy: 'user-1',
    });

    const result = await deleteMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
    });

    expect(result.message).toBe('Message template deleted successfully.');
    expect(messageTemplatesRepository.items[0].deletedAt).toBeDefined();
  });

  it('should throw when template not found', async () => {
    await expect(() =>
      deleteMessageTemplate.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
