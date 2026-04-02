import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';
import { ListMessageTemplatesUseCase } from './list-message-templates';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;
let listMessageTemplates: ListMessageTemplatesUseCase;

describe('ListMessageTemplatesUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(
      messageTemplatesRepository,
    );
    listMessageTemplates = new ListMessageTemplatesUseCase(
      messageTemplatesRepository,
    );
  });

  it('should list message templates with pagination', async () => {
    for (let i = 1; i <= 5; i++) {
      await createMessageTemplate.execute({
        tenantId: 'tenant-1',
        name: `Template ${i}`,
        channel: 'EMAIL',
        body: `Body ${i}`,
        createdBy: 'user-1',
      });
    }

    const result = await listMessageTemplates.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.messageTemplates).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no templates exist', async () => {
    const result = await listMessageTemplates.execute({
      tenantId: 'tenant-1',
    });

    expect(result.messageTemplates).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
