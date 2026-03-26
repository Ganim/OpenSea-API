import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { InMemoryAccountantAccessesRepository } from '@/repositories/finance/in-memory/in-memory-accountant-accesses-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAccountantDataUseCase } from './get-accountant-data';

let accountantRepo: InMemoryAccountantAccessesRepository;
let entriesRepo: InMemoryFinanceEntriesRepository;
let categoriesRepo: InMemoryFinanceCategoriesRepository;
let sut: GetAccountantDataUseCase;

describe('GetAccountantDataUseCase', () => {
  beforeEach(() => {
    accountantRepo = new InMemoryAccountantAccessesRepository();
    entriesRepo = new InMemoryFinanceEntriesRepository();
    categoriesRepo = new InMemoryFinanceCategoriesRepository();
    sut = new GetAccountantDataUseCase(
      accountantRepo,
      entriesRepo,
      categoriesRepo,
    );
  });

  it('should return financial data for a valid token', async () => {
    await accountantRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      accessToken: 'acc_valid_token',
    });

    const result = await sut.execute({
      accessToken: 'acc_valid_token',
      year: 2026,
      month: 3,
    });

    expect(result.period).toEqual({ year: 2026, month: 3 });
    expect(result.categories).toBeDefined();
    expect(result.entries).toBeDefined();
    expect(result.summary).toBeDefined();
  });

  it('should reject invalid token', async () => {
    await expect(
      sut.execute({
        accessToken: 'acc_invalid_token',
        year: 2026,
        month: 3,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject expired token', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await accountantRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      accessToken: 'acc_expired_token',
      expiresAt: pastDate,
    });

    await expect(
      sut.execute({
        accessToken: 'acc_expired_token',
        year: 2026,
        month: 3,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it('should reject deactivated token', async () => {
    const access = await accountantRepo.create({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      accessToken: 'acc_deactivated',
    });

    await accountantRepo.deactivate(access.id, 'tenant-1');

    await expect(
      sut.execute({
        accessToken: 'acc_deactivated',
        year: 2026,
        month: 3,
      }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
