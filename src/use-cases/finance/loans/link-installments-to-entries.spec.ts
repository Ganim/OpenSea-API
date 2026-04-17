import { InMemoryLoansRepository } from '@/repositories/finance/in-memory/in-memory-loans-repository';
import { InMemoryLoanInstallmentsRepository } from '@/repositories/finance/in-memory/in-memory-loan-installments-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { CreateLoanUseCase } from './create-loan';
import { LinkInstallmentsToEntriesUseCase } from './link-installments-to-entries';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { beforeEach, describe, expect, it } from 'vitest';

let loansRepository: InMemoryLoansRepository;
let installmentsRepository: InMemoryLoanInstallmentsRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let createLoanUseCase: CreateLoanUseCase;
let sut: LinkInstallmentsToEntriesUseCase;

let seededBankAccountId: string;
let seededCostCenterId: string;
let seededCategoryId: string;

describe('LinkInstallmentsToEntriesUseCase', () => {
  beforeEach(async () => {
    loansRepository = new InMemoryLoansRepository();
    installmentsRepository = new InMemoryLoanInstallmentsRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();

    createLoanUseCase = new CreateLoanUseCase(
      loansRepository,
      installmentsRepository,
      bankAccountsRepository,
      costCentersRepository,
    );

    sut = new LinkInstallmentsToEntriesUseCase(
      loansRepository,
      installmentsRepository,
      entriesRepository,
      categoriesRepository,
      costCentersRepository,
    );

    const bankAccount = await bankAccountsRepository.create({
      tenantId: 'tenant-1',
      companyId: 'company-1',
      name: 'Conta Principal',
      bankCode: '001',
      agency: '1234',
      accountNumber: '56789',
      accountType: 'CHECKING',
    });
    seededBankAccountId = bankAccount.id.toString();

    const costCenter = await costCentersRepository.create({
      tenantId: 'tenant-1',
      code: 'CC-001',
      name: 'Administrativo',
    });
    seededCostCenterId = costCenter.id.toString();

    const category = await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Empréstimos',
      slug: 'emprestimos',
      type: 'EXPENSE',
    });
    seededCategoryId = category.id.toString();
  });

  it('should create payable finance entries for all pending installments', async () => {
    const { loan } = await createLoanUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Empréstimo BB',
      type: 'PERSONAL',
      principalAmount: 12000,
      interestRate: 12,
      startDate: new Date('2026-01-01'),
      totalInstallments: 3,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      loanId: loan.id,
      categoryId: seededCategoryId,
    });

    expect(result.entriesCreated).toBe(3);
    expect(entriesRepository.items).toHaveLength(3);

    // All entries should be PAYABLE
    for (const entry of entriesRepository.items) {
      expect(entry.type).toBe('PAYABLE');
    }
  });

  it('should be idempotent - running twice does not duplicate entries', async () => {
    const { loan } = await createLoanUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Empréstimo BB',
      type: 'PERSONAL',
      principalAmount: 6000,
      interestRate: 0,
      startDate: new Date('2026-01-01'),
      totalInstallments: 3,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      loanId: loan.id,
      categoryId: seededCategoryId,
    });

    const result2 = await sut.execute({
      tenantId: 'tenant-1',
      loanId: loan.id,
      categoryId: seededCategoryId,
    });

    expect(result2.entriesCreated).toBe(0);
    expect(entriesRepository.items).toHaveLength(3);
  });

  it('should throw if loan not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        loanId: 'non-existent-id',
        categoryId: seededCategoryId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should include loan name in entry description', async () => {
    const { loan } = await createLoanUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Empréstimo Itau',
      type: 'PERSONAL',
      principalAmount: 3000,
      interestRate: 0,
      startDate: new Date('2026-01-01'),
      totalInstallments: 3,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      loanId: loan.id,
      categoryId: seededCategoryId,
    });

    const firstEntry = entriesRepository.items[0];
    expect(firstEntry.description).toContain('Empréstimo Itau');
    expect(firstEntry.description).toContain('1/3');
  });

  // Regression: P1-04 — idempotency must be keyed off the installment id (in
  // metadata.loanInstallmentId), not the rendered description. Renaming the
  // loan used to change the description and re-running link-installments
  // created duplicate entries. It must not.
  it('should stay idempotent after the loan is renamed', async () => {
    const { loan } = await createLoanUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Empréstimo Original',
      type: 'PERSONAL',
      principalAmount: 6000,
      interestRate: 0,
      startDate: new Date('2026-01-01'),
      totalInstallments: 3,
    });

    await sut.execute({
      tenantId: 'tenant-1',
      loanId: loan.id,
      categoryId: seededCategoryId,
    });

    expect(entriesRepository.items).toHaveLength(3);
    expect(entriesRepository.items[0].description).toContain(
      'Empréstimo Original',
    );
    expect(entriesRepository.items[0].metadata.loanInstallmentId).toBeTruthy();

    // Rename the loan on the domain entity (simulates an updateLoan call)
    await loansRepository.update({
      id: new (
        await import('@/entities/domain/unique-entity-id')
      ).UniqueEntityID(loan.id),
      tenantId: 'tenant-1',
      name: 'Empréstimo Renomeado',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      loanId: loan.id,
      categoryId: seededCategoryId,
    });

    expect(result.entriesCreated).toBe(0);
    expect(entriesRepository.items).toHaveLength(3);
  });
});
