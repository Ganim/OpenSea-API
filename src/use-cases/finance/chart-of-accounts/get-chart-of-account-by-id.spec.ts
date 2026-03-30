import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetChartOfAccountByIdUseCase } from './get-chart-of-account-by-id';

let repository: InMemoryChartOfAccountsRepository;
let sut: GetChartOfAccountByIdUseCase;

describe('GetChartOfAccountByIdUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryChartOfAccountsRepository();
    sut = new GetChartOfAccountByIdUseCase(repository);
  });

  it('should get a chart of account by id', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: created.id.toString(),
    });

    expect(result.chartOfAccount.code).toBe('1');
    expect(result.chartOfAccount.name).toBe('Ativo');
  });

  it('should throw when account does not exist', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when account belongs to different tenant', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await expect(
      sut.execute({ tenantId: 'tenant-2', id: created.id.toString() }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
