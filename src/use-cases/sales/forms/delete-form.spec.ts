import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteFormUseCase } from './delete-form';

let formsRepository: InMemoryFormsRepository;
let deleteForm: DeleteFormUseCase;

describe('DeleteFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    deleteForm = new DeleteFormUseCase(formsRepository);
  });

  it('should soft delete a form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
    });

    await deleteForm.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
    });

    const deleted = await formsRepository.findById(form.id, 'tenant-1');
    expect(deleted).toBeNull();
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      deleteForm.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
