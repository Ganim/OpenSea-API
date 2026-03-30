import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteChartOfAccountUseCase } from './delete-chart-of-account';

let repository: InMemoryChartOfAccountsRepository;
let sut: DeleteChartOfAccountUseCase;

describe('DeleteChartOfAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryChartOfAccountsRepository();
    sut = new DeleteChartOfAccountUseCase(repository);
  });

  it('should delete a chart of account', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      id: created.id.toString(),
    });

    const found = await repository.findById(created.id, 'tenant-1');
    expect(found).toBeNull();
  });

  it('should throw when account not found', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not delete a system account', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
      isSystem: true,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: created.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not delete an account with children', async () => {
    const parent = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await repository.create({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Ativo Circulante',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
      parentId: parent.id.toString(),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: parent.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
