import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateChartOfAccountUseCase } from './create-chart-of-account';

let repository: InMemoryChartOfAccountsRepository;
let sut: CreateChartOfAccountUseCase;

describe('CreateChartOfAccountUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryChartOfAccountsRepository();
    sut = new CreateChartOfAccountUseCase(repository);
  });

  it('should create a chart of account', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    expect(result.chartOfAccount).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        code: '1',
        name: 'Ativo',
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
        isActive: true,
        isSystem: false,
      }),
    );
  });

  it('should create a child account with parent', async () => {
    const parent = await sut.execute({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const child = await sut.execute({
      tenantId: 'tenant-1',
      code: '1.1',
      name: 'Ativo Circulante',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
      parentId: parent.chartOfAccount.id,
    });

    expect(child.chartOfAccount.parentId).toBe(parent.chartOfAccount.id);
  });

  it('should not create with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        code: '1',
        name: '',
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with empty code', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        code: '',
        name: 'Ativo',
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with invalid code format', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        code: 'ABC',
        name: 'Ativo',
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with duplicate code in same tenant', async () => {
    await sut.execute({
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
        code: '1',
        name: 'Outro Ativo',
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same code in different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({
      tenantId: 'tenant-2',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    expect(result.chartOfAccount.code).toBe('1');
  });

  it('should not create child with different type than parent', async () => {
    const parent = await sut.execute({
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
        code: '1.1',
        name: 'Receita Operacional',
        type: 'REVENUE',
        accountClass: 'OPERATIONAL',
        nature: 'CREDIT',
        parentId: parent.chartOfAccount.id,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create with non-existent parent', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        code: '1.1',
        name: 'Ativo Circulante',
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
        parentId: 'non-existent-id',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should create a system account', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
      isSystem: true,
    });

    expect(result.chartOfAccount.isSystem).toBe(true);
  });
});
