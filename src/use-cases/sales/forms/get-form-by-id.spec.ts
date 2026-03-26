import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormFieldsRepository } from '@/repositories/sales/in-memory/in-memory-form-fields-repository';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetFormByIdUseCase } from './get-form-by-id';

let formsRepository: InMemoryFormsRepository;
let formFieldsRepository: InMemoryFormFieldsRepository;
let getFormById: GetFormByIdUseCase;

describe('GetFormByIdUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    formFieldsRepository = new InMemoryFormFieldsRepository();
    getFormById = new GetFormByIdUseCase(formsRepository, formFieldsRepository);
  });

  it('should get a form with its fields', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
    });

    await formFieldsRepository.create({
      formId: form.id.toString(),
      label: 'Name',
      type: 'TEXT',
      isRequired: true,
      order: 0,
    });

    const result = await getFormById.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
    });

    expect(result.form.title).toBe('Test Form');
    expect(result.form.fields).toHaveLength(1);
    expect(result.form.fields![0].label).toBe('Name');
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      getFormById.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
