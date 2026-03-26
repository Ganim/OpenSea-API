import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { PublishFormUseCase } from './publish-form';

let formsRepository: InMemoryFormsRepository;
let publishForm: PublishFormUseCase;

describe('PublishFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    publishForm = new PublishFormUseCase(formsRepository);
  });

  it('should publish a draft form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
    });

    const result = await publishForm.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
    });

    expect(result.form.status).toBe('PUBLISHED');
  });

  it('should not publish an already published form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
      status: 'PUBLISHED',
    });

    await expect(() =>
      publishForm.execute({
        tenantId: 'tenant-1',
        formId: form.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      publishForm.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
