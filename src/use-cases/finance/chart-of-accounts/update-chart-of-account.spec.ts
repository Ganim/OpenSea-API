import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateChartOfAccountUseCase } from './update-chart-of-account';

let repository: InMemoryChartOfAccountsRepository;
let sut: UpdateChartOfAccountUseCase;

describe('UpdateChartOfAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryChartOfAccountsRepository();
    sut = new UpdateChartOfAccountUseCase(repository);
  });

  it('should update a chart of account name', async () => {
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
      name: 'Ativo Total',
    });

    expect(result.chartOfAccount.name).toBe('Ativo Total');
  });

  it('should update code with valid format', async () => {
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
      code: '1.0',
    });

    expect(result.chartOfAccount.code).toBe('1.0');
  });

  it('should throw when account not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        name: 'Updated',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not update a system account', async () => {
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
        name: 'Updated',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with empty name', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: created.id.toString(),
        name: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with invalid code format', async () => {
    const created = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: created.id.toString(),
        code: 'ABC',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update with duplicate code', async () => {
    const account1 = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await repository.create({
      tenantId: 'tenant-1',
      code: '2',
      name: 'Passivo',
      type: 'LIABILITY',
      accountClass: 'CURRENT',
      nature: 'CREDIT',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: account1.id.toString(),
        code: '2',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not update child type to differ from parent', async () => {
    const parent = await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const child = await repository.create({
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
        id: child.id.toString(),
        type: 'REVENUE',
        parentId: parent.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
