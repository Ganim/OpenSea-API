import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryMessageTemplatesRepository } from '@/repositories/sales/in-memory/in-memory-message-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateMessageTemplateUseCase } from './create-message-template';

let messageTemplatesRepository: InMemoryMessageTemplatesRepository;
let createMessageTemplate: CreateMessageTemplateUseCase;

describe('CreateMessageTemplateUseCase', () => {
  beforeEach(() => {
    messageTemplatesRepository = new InMemoryMessageTemplatesRepository();
    createMessageTemplate = new CreateMessageTemplateUseCase(
      messageTemplatesRepository,
    );
  });

  it('should create an email template with variables', async () => {
    const result = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Welcome Email',
      channel: 'EMAIL',
      subject: 'Welcome {{customerName}}!',
      body: 'Hello {{customerName}}, your order #{{orderNumber}} has been confirmed.',
      createdBy: 'user-1',
    });

    expect(result.messageTemplate).toBeDefined();
    expect(result.messageTemplate.name).toBe('Welcome Email');
    expect(result.messageTemplate.channel).toBe('EMAIL');
    expect(result.messageTemplate.variables).toEqual([
      'customerName',
      'orderNumber',
    ]);
    expect(result.messageTemplate.isActive).toBe(true);
  });

  it('should create a WhatsApp template', async () => {
    const result = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Order Update',
      channel: 'WHATSAPP',
      body: 'Your order {{orderId}} is {{status}}.',
      createdBy: 'user-1',
    });

    expect(result.messageTemplate.channel).toBe('WHATSAPP');
    expect(result.messageTemplate.variables).toEqual(['orderId', 'status']);
  });

  it('should create a template without variables', async () => {
    const result = await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Static Message',
      channel: 'SMS',
      body: 'Thank you for your purchase!',
      createdBy: 'user-1',
    });

    expect(result.messageTemplate.variables).toEqual([]);
  });

  it('should not allow empty name', async () => {
    await expect(() =>
      createMessageTemplate.execute({
        tenantId: 'tenant-1',
        name: '',
        channel: 'EMAIL',
        body: 'Test body',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow empty body', async () => {
    await expect(() =>
      createMessageTemplate.execute({
        tenantId: 'tenant-1',
        name: 'Empty Body',
        channel: 'EMAIL',
        body: '',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate name in same tenant', async () => {
    await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Duplicate Name',
      channel: 'EMAIL',
      body: 'First template',
      createdBy: 'user-1',
    });

    await expect(() =>
      createMessageTemplate.execute({
        tenantId: 'tenant-1',
        name: 'Duplicate Name',
        channel: 'SMS',
        body: 'Second template',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same name in different tenants', async () => {
    await createMessageTemplate.execute({
      tenantId: 'tenant-1',
      name: 'Same Name',
      channel: 'EMAIL',
      body: 'First',
      createdBy: 'user-1',
    });

    const result = await createMessageTemplate.execute({
      tenantId: 'tenant-2',
      name: 'Same Name',
      channel: 'EMAIL',
      body: 'Second',
      createdBy: 'user-2',
    });

    expect(result.messageTemplate.name).toBe('Same Name');
  });
});
