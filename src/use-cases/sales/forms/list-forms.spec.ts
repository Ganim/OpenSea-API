import { InMemoryFormsRepository } from '@/repositories/sales/in-memory/in-memory-forms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListFormsUseCase } from './list-forms';

let formsRepository: InMemoryFormsRepository;
let listForms: ListFormsUseCase;

describe('ListFormsUseCase', () => {
  beforeEach(() => {
    formsRepository = new InMemoryFormsRepository();
    listForms = new ListFormsUseCase(formsRepository);
  });

  it('should list forms with pagination', async () => {
    for (let i = 0; i < 25; i++) {
      await formsRepository.create({
        tenantId: 'tenant-1',
        title: `Form ${i}`,
        createdBy: 'user-1',
      });
    }

    const result = await listForms.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 10,
    });

    expect(result.forms).toHaveLength(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by status', async () => {
    await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Draft',
      createdBy: 'user-1',
    });

    await formsRepository.create({
      tenantId: 'tenant-1',
      title: 'Published',
      createdBy: 'user-1',
      status: 'PUBLISHED',
    });

    const result = await listForms.execute({
      tenantId: 'tenant-1',
      status: 'DRAFT',
    });

    expect(result.forms).toHaveLength(1);
    expect(result.forms[0].status).toBe('DRAFT');
  });
});
