import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSupplierHistoryUseCase } from './get-supplier-history';

let contractsRepository: InMemoryContractsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: GetSupplierHistoryUseCase;

describe('GetSupplierHistoryUseCase', () => {
  beforeEach(async () => {
    contractsRepository = new InMemoryContractsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetSupplierHistoryUseCase(
      contractsRepository,
      financeEntriesRepository,
    );

    // Seed contracts for the same company
    await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-001',
      title: 'Contrato Limpeza 2025',
      companyId: 'company-1',
      companyName: 'Clean Corp',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-12-31'),
    });

    await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-002',
      title: 'Contrato Limpeza 2026',
      companyId: 'company-1',
      companyName: 'Clean Corp',
      totalValue: 14000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1166.67,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    // Seed paid entries for the company
    for (let i = 0; i < 5; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAG-${i}`,
        description: `Pagamento Clean Corp ${i}`,
        categoryId: 'cat-1',
        supplierName: 'Clean Corp',
        supplierId: 'company-1',
        expectedAmount: 1000,
        issueDate: new Date('2025-01-01'),
        dueDate: new Date(2025, i + 1, 1),
        status: 'PAID',
        actualAmount: 1000,
      });
    }
  });

  it('should return supplier history by companyId', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      companyId: 'company-1',
    });

    expect(result.totalContracts).toBe(2);
    expect(result.contracts).toHaveLength(2);
    expect(result.totalPaymentsCount).toBe(5);
    expect(result.totalPaymentsValue).toBe(5000);
  });

  it('should return supplier history by companyName', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      companyName: 'Clean Corp',
    });

    expect(result.totalContracts).toBe(2);
  });

  it('should throw if neither companyId nor companyName provided', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should return empty when no contracts found', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      companyId: 'non-existent',
    });

    expect(result.totalContracts).toBe(0);
    expect(result.contracts).toHaveLength(0);
  });
});
