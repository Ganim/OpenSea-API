import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';
import { GetMessageTemplateByIdUseCase } from './get-message-template-by-id';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;
let getMessageTemplateById: GetMessageTemplateByIdUseCase;

describe('GetMessageTemplateByIdUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(
      messageTemplatesRepository,
    );
    getMessageTemplateById = new GetMessageTemplateByIdUseCase(
      messageTemplatesRepository,
    );
  });

  it('should return a message template by id', async () => {
    const { messageTemplate: created } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Find Me',
      channel: 'WHATSAPP',
      body: 'Hello {{name}}',
      createdBy: 'user-1',
    });

    const result = await getMessageTemplateById.execute({
      tenantId: 'tenant-1',
      id: created.id,
    });

    expect(result.messageTemplate.name).toBe('Find Me');
    expect(result.messageTemplate.channel).toBe('WHATSAPP');
  });

  it('should throw when template not found', async () => {
    await expect(() =>
      getMessageTemplateById.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
