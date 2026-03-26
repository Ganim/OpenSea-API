import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormSubmissionsRepository } from '@/repositories/sales/in-memory/in-memory-form-submissions-repository';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SubmitFormUseCase } from './submit-form';

let formsRepository: InMemoryFormsRepository;
let submissionsRepository: InMemoryFormSubmissionsRepository;
let submitForm: SubmitFormUseCase;

describe('SubmitFormUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    submissionsRepository = new InMemoryFormSubmissionsRepository();
    submitForm = new SubmitFormUseCase(formsRepository, submissionsRepository);
  });

  it('should submit to a published form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Published Form',
      createdBy: 'user-1',
      status: 'PUBLISHED',
    });

    const result = await submitForm.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
      data: { name: 'John', email: 'john@example.com' },
    });

    expect(result.submission).toBeDefined();
    expect(result.submission.data).toEqual({
      name: 'John',
      email: 'john@example.com',
    });

    const updatedForm = await formsRepository.findById(
      form.id,
      'tenant-1',
    );
    expect(updatedForm?.submissionCount).toBe(1);
  });

  it('should not submit to a draft form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Draft Form',
      createdBy: 'user-1',
    });

    await expect(() =>
      submitForm.execute({
        tenantId: 'tenant-1',
        formId: form.id.toString(),
        data: { name: 'John' },
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      submitForm.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
        data: { name: 'John' },
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
