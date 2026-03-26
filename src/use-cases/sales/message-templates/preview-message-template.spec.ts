import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';
import { PreviewMessageTemplateUseCase } from './preview-message-template';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;
let previewMessageTemplate: PreviewMessageTemplateUseCase;

describe('PreviewMessageTemplateUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(messageTemplatesRepository);
    previewMessageTemplate = new PreviewMessageTemplateUseCase(messageTemplatesRepository);
  });

  it('should render template with sample data', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Preview Test',
      channel: 'EMAIL',
      subject: 'Hello {{customerName}}',
      body: 'Dear {{customerName}}, your order #{{orderNumber}} is {{status}}.',
      createdBy: 'user-1',
    });

    const result = await previewMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      sampleData: {
        customerName: 'John Doe',
        orderNumber: '12345',
        status: 'confirmed',
      },
    });

    expect(result.renderedBody).toBe('Dear John Doe, your order #12345 is confirmed.');
    expect(result.subject).toBe('Hello John Doe');
    expect(result.variables).toEqual(['customerName', 'orderNumber', 'status']);
  });

  it('should keep unmatched placeholders', async () => {
    const { messageTemplate } = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Partial Preview',
      channel: 'SMS',
      body: 'Hello {{name}}, code: {{code}}',
      createdBy: 'user-1',
    });

    const result = await previewMessageTemplate.execute({
      tenantId: 'tenant-1',
      id: messageTemplate.id,
      sampleData: { name: 'Alice' },
    });

    expect(result.renderedBody).toBe('Hello Alice, code: {{code}}');
  });

  it('should throw when template not found', async () => {
    await expect(() =>
      previewMessageTemplate.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        sampleData: {},
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
