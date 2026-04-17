import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBankAccountsUseCase } from './list-bank-accounts';

let repository: InMemoryBankAccountsRepository;
let sut: ListBankAccountsUseCase;

describe('ListBankAccountsUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryBankAccountsRepository();
    sut = new ListBankAccountsUseCase(repository);
  });

  it('should list bank accounts', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '12345-6',
      accountType: 'CHECKING',
    });

    await repository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Poupança',
      bankCode: '001',
      agency: '1234',
      accountNumber: '54321-0',
      accountType: 'SAVINGS',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.bankAccounts).toHaveLength(2);
    // default sortBy=name asc => "Poupança" < "Principal" (o < r)
    expect(result.bankAccounts[0].name).toBe('Conta Poupança');
    expect(result.bankAccounts[1].name).toBe('Conta Principal');
    expect(result.meta).toEqual({ total: 2, page: 1, limit: 20, pages: 1 });
  });

  it('should return empty array if no bank accounts', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.bankAccounts).toHaveLength(0);
    expect(result.bankAccounts).toEqual([]);
    expect(result.meta.total).toBe(0);
  });

  it('should filter by status', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      name: 'A',
      bankCode: '001',
      agency: '1',
      accountNumber: '1',
      accountType: 'CHECKING',
    });
    const b = await repository.create({
      tenantId: 'tenant-1',
      name: 'B',
      bankCode: '001',
      agency: '1',
      accountNumber: '2',
      accountType: 'CHECKING',
    });
    b.status = 'INACTIVE';

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'ACTIVE',
    });
    expect(result.bankAccounts).toHaveLength(1);
    expect(result.bankAccounts[0].name).toBe('A');
  });

  it('should paginate', async () => {
    for (let i = 0; i < 5; i++) {
      await repository.create({
        tenantId: 'tenant-1',
        name: `Account ${i}`,
        bankCode: '001',
        agency: '1',
        accountNumber: String(i),
        accountType: 'CHECKING',
      });
    }

    const page1 = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });
    expect(page1.bankAccounts).toHaveLength(2);
    expect(page1.meta).toEqual({ total: 5, page: 1, limit: 2, pages: 3 });

    const page2 = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 2,
    });
    expect(page2.bankAccounts).toHaveLength(2);
    expect(page2.meta.page).toBe(2);
  });

  it('should search by name', async () => {
    await repository.create({
      tenantId: 'tenant-1',
      name: 'Itaú Empresarial',
      bankCode: '341',
      agency: '1',
      accountNumber: '1',
      accountType: 'CHECKING',
    });
    await repository.create({
      tenantId: 'tenant-1',
      name: 'Santander',
      bankCode: '033',
      agency: '1',
      accountNumber: '2',
      accountType: 'CHECKING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      search: 'itaú',
    });
    expect(result.bankAccounts).toHaveLength(1);
    expect(result.bankAccounts[0].name).toBe('Itaú Empresarial');
  });
});
