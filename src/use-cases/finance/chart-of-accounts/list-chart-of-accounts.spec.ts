import { InMemoryChartOfAccountsRepository } from '@/repositories/finance/in-memory/in-memory-chart-of-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListChartOfAccountsUseCase } from './list-chart-of-accounts';

let repository: InMemoryChartOfAccountsRepository;
let sut: ListChartOfAccountsUseCase;

describe('ListChartOfAccountsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryChartOfAccountsRepository();
    sut = new ListChartOfAccountsUseCase(repository);
  });

  it('should list chart of accounts with pagination', async () => {
    await repository.create({
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

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.chartOfAccounts).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.meta.page).toBe(1);
  });

  it('should return empty list for tenant without accounts', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.chartOfAccounts).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should paginate correctly', async () => {
    for (let i = 1; i <= 5; i++) {
      await repository.create({
        tenantId: 'tenant-1',
        code: `${i}`,
        name: `Account ${i}`,
        type: 'ASSET',
        accountClass: 'CURRENT',
        nature: 'DEBIT',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 2,
    });

    expect(result.chartOfAccounts).toHaveLength(2);
    expect(result.meta.total).toBe(5);
    expect(result.meta.page).toBe(2);
    expect(result.meta.pages).toBe(3);
  });

  it('should only return accounts for the specified tenant', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    await repository.create({
      tenantId: 'tenant-2',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.chartOfAccounts).toHaveLength(1);
  });

  it('should order by code ascending', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      code: '3',
      name: 'Patrimônio Líquido',
      type: 'EQUITY',
      accountClass: 'OTHER',
      nature: 'CREDIT',
    });

    await repository.create({
      tenantId: 'tenant-1',
      code: '1',
      name: 'Ativo',
      type: 'ASSET',
      accountClass: 'CURRENT',
      nature: 'DEBIT',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.chartOfAccounts[0].code).toBe('1');
    expect(result.chartOfAccounts[1].code).toBe('3');
  });
});
