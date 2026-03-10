import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { InMemoryConsortiumPaymentsRepository } from '@/repositories/finance/in-memory/in-memory-consortium-payments-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryCostCentersRepository } from '@/repositories/finance/in-memory/in-memory-cost-centers-repository';
import { InMemoryBankAccountsRepository } from '@/repositories/finance/in-memory/in-memory-bank-accounts-repository';
import { CreateConsortiumUseCase } from './create-consortium';
import { LinkPaymentsToEntriesUseCase } from './link-payments-to-entries';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { beforeEach, describe, expect, it } from 'vitest';

let consortiaRepository: InMemoryConsortiaRepository;
let paymentsRepository: InMemoryConsortiumPaymentsRepository;
let entriesRepository: InMemoryFinanceEntriesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let costCentersRepository: InMemoryCostCentersRepository;
let bankAccountsRepository: InMemoryBankAccountsRepository;
let createConsortiumUseCase: CreateConsortiumUseCase;
let sut: LinkPaymentsToEntriesUseCase;

let seededBankAccountId: string;
let seededCostCenterId: string;
let seededCategoryId: string;

describe('LinkPaymentsToEntriesUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    paymentsRepository = new InMemoryConsortiumPaymentsRepository();
    entriesRepository = new InMemoryFinanceEntriesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    costCentersRepository = new InMemoryCostCentersRepository();
    bankAccountsRepository = new InMemoryBankAccountsRepository();

    createConsortiumUseCase = new CreateConsortiumUseCase(
      consortiaRepository,
      paymentsRepository,
      bankAccountsRepository,
      costCentersRepository,
    );

    sut = new LinkPaymentsToEntriesUseCase(
      consortiaRepository,
      paymentsRepository,
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
      name: 'Consórcios',
      type: 'EXPENSE',
    });
    seededCategoryId = category.id.toString();
  });

  it('should create payable finance entries for all pending payments', async () => {
    const { consortium } = await createConsortiumUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Consórcio Auto',
      administrator: 'Porto Seguro',
      creditValue: 50000,
      monthlyPayment: 800,
      totalInstallments: 3,
      startDate: new Date('2026-01-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: consortium.id,
      categoryId: seededCategoryId,
    });

    expect(result.entriesCreated).toBe(3);
    expect(entriesRepository.items).toHaveLength(3);

    for (const entry of entriesRepository.items) {
      expect(entry.type).toBe('PAYABLE');
    }
  });

  it('should be idempotent - running twice does not duplicate entries', async () => {
    const { consortium } = await createConsortiumUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Consórcio Auto',
      administrator: 'Porto Seguro',
      creditValue: 50000,
      monthlyPayment: 800,
      totalInstallments: 3,
      startDate: new Date('2026-01-01'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: consortium.id,
      categoryId: seededCategoryId,
    });

    const result2 = await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: consortium.id,
      categoryId: seededCategoryId,
    });

    expect(result2.entriesCreated).toBe(0);
    expect(entriesRepository.items).toHaveLength(3);
  });

  it('should throw if consortium not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        consortiumId: 'non-existent-id',
        categoryId: seededCategoryId,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should include consortium name in entry description', async () => {
    const { consortium } = await createConsortiumUseCase.execute({
      tenantId: 'tenant-1',
      bankAccountId: seededBankAccountId,
      costCenterId: seededCostCenterId,
      name: 'Consórcio Imóvel',
      administrator: 'Embracon',
      creditValue: 200000,
      monthlyPayment: 1500,
      totalInstallments: 3,
      startDate: new Date('2026-01-01'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      consortiumId: consortium.id,
      categoryId: seededCategoryId,
    });

    const firstEntry = entriesRepository.items[0];
    expect(firstEntry.description).toContain('Consórcio Imóvel');
    expect(firstEntry.description).toContain('1/3');
  });
});
