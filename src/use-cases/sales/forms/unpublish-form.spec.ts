import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UnpublishFormUseCase } from './unpublish-form';

let formsRepository: InMemoryFormsRepository;
let unpublishForm: UnpublishFormUseCase;

describe('UnpublishFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    unpublishForm = new UnpublishFormUseCase(formsRepository);
  });

  it('should unpublish a published form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
      status: 'PUBLISHED',
    });

    const result = await unpublishForm.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
    });

    expect(result.form.status).toBe('DRAFT');
  });

  it('should not unpublish a draft form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
    });

    await expect(() =>
      unpublishForm.execute({
        tenantId: 'tenant-1',
        formId: form.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      unpublishForm.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
