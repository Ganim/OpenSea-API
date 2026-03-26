import { InMemoryAccountantAccessesRepository } from '@/repositories/finance/in-memory/in-memory-accountant-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAccountantAccessesUseCase } from './list-accountant-accesses';

let repository: InMemoryAccountantAccessesRepository;
let sut: ListAccountantAccessesUseCase;

describe('ListAccountantAccessesUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryAccountantAccessesRepository();
    sut = new ListAccountantAccessesUseCase(repository);
  });

  it('should list all accesses for a tenant', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      email: 'a@teste.com',
      name: 'Contador A',
      accessToken: 'acc_a',
    });

    await repository.create({
      tenantId: 'tenant-1',
      email: 'b@teste.com',
      name: 'Contador B',
      accessToken: 'acc_b',
    });

    await repository.create({
      tenantId: 'tenant-2',
      email: 'c@teste.com',
      name: 'Contador C',
      accessToken: 'acc_c',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.accesses).toHaveLength(2);
    expect(result.accesses[0].email).toBeDefined();
  });

  it('should return empty array when no accesses exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });
    expect(result.accesses).toHaveLength(0);
  });
});
