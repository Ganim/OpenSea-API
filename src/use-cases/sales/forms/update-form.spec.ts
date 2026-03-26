import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormFieldsRepository } from '@/repositories/sales/in-memory/in-memory-form-fields-repository';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateFormUseCase } from './update-form';

let formsRepository: InMemoryFormsRepository;
let formFieldsRepository: InMemoryFormFieldsRepository;
let updateForm: UpdateFormUseCase;

describe('UpdateFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    formFieldsRepository = new InMemoryFormFieldsRepository();
    updateForm = new UpdateFormUseCase(formsRepository, formFieldsRepository);
  });

  it('should update a draft form title', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Old Title',
      createdBy: 'user-1',
    });

    const result = await updateForm.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
      title: 'New Title',
    });

    expect(result.form.title).toBe('New Title');
  });

  it('should not update a published form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Published Form',
      createdBy: 'user-1',
      status: 'PUBLISHED',
    });

    await expect(() =>
      updateForm.execute({
        tenantId: 'tenant-1',
        formId: form.id.toString(),
        title: 'Updated Title',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      updateForm.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
        title: 'Test',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
