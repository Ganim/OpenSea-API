import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';
import { UpdateMessageTemplateUseCase } from './update-message-template';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;
let updateMessageTemplate: UpdateMessageTemplateUseCase;

describe('UpdateMessageTemplateUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(messageTemplatesRepository);
    updateMessageTemplate = new UpdateMessageTemplateUseCase(messageTemplatesRepository);
  });

  it('should update template name', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Original',
      channel: 'EMAIL',
      body: 'Test body',
      createdBy: 'user-1',
    });

    const result = await updateMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      name: 'Updated',
    });

    expect(result.messageTemplate.name).toBe('Updated');
  });

  it('should update body and re-extract variables', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Var Test',
      channel: 'EMAIL',
      body: 'Hello {{name}}',
      createdBy: 'user-1',
    });

    const result = await updateMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      body: 'Hello {{firstName}} {{lastName}}, order #{{orderNumber}}',
    });

    expect(result.messageTemplate.variables).toEqual(['firstName', 'lastName', 'orderNumber']);
  });

  it('should throw when template not found', async () => {
    await expect(() =>
      updateMessageTemplate.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not allow duplicate name', async () => {
    await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Existing Name',
      channel: 'EMAIL',
      body: 'First',
      createdBy: 'user-1',
    });

    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Other Name',
      channel: 'EMAIL',
      body: 'Second',
      createdBy: 'user-1',
    });

    await expect(() =>
      updateMessageTemplate.execute({
        tenantId: 'tenant-1',
        id: messageTemplate.id,
        name: 'Existing Name',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
