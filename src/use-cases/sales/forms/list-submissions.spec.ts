import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFormSubmissionsRepository } from '@/repositories/sales/in-memory/in-memory-form-submissions-repository';
import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSubmissionsUseCase } from './list-submissions';

let formsRepository: InMemoryFormsRepository;
let submissionsRepository: InMemoryFormSubmissionsRepository;
let listSubmissions: ListSubmissionsUseCase;

describe('ListSubmissionsUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    submissionsRepository = new InMemoryFormSubmissionsRepository();
    listSubmissions = new ListSubmissionsUseCase(
      formsRepository,
      submissionsRepository,
    );
  });

  it('should list submissions for a form', async () => {
    const form = await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Test Form',
      createdBy: 'user-1',
    });

    await submissionsRepository.create({
      formId: form.id.toString(),
      data: { name: 'John', email: 'john@example.com' },
    });

    await submissionsRepository.create({
      formId: form.id.toString(),
      data: { name: 'Jane', email: 'jane@example.com' },
    });

    const result = await listSubmissions.execute({
      tenantId: 'tenant-1',
      formId: form.id.toString(),
    });

    expect(result.submissions).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should throw when form is not found', async () => {
    await expect(() =>
      listSubmissions.execute({
        tenantId: 'tenant-1',
        formId: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
