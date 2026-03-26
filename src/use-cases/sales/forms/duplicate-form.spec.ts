import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormFieldsRepository } from '@/repositories/sales/in-memory/in-memory-form-fields-repository';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DuplicateFormUseCase } from './duplicate-form';

let formsRepository: InMemoryFormsRepository;
let formFieldsRepository: InMemoryFormFieldsRepository;
let duplicateForm: DuplicateFormUseCase;

describe('DuplicateFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    formFieldsRepository = new InMemoryFormFieldsRepository();
    duplicateForm = new DuplicateFormUseCase(
      formsRepository,
      formFieldsRepository,
    );
  });

  it('should duplicate a form as DRAFT with fields', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Original Form',
      description: 'Original description',
      createdBy: 'user-1',
      status: 'PUBLISHED',
    });

    await formFieldsRepository.create({
      formId: form.id.toString(),
      label: 'Name',
      type: 'TEXT',
      isRequired: true,
      order: 0,
    });

    await formFieldsRepository.create({
      formId: form.id.toString(),
      label: 'Email',
      type: 'EMAIL',
      order: 1,
    });

    const result = await duplicateForm.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
      createdBy: 'user-2',
    });

    expect(result.form.title).toBe('Original Form (Copy)');
    expect(result.form.status).toBe('DRAFT');
    expect(result.form.submissionCount).toBe(0);
    expect(result.form.fields).toHaveLength(2);
    expect(result.form.id).not.toBe(form.id.toString());
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      duplicateForm.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
