import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GenerateContractEntriesUseCase } from './generate-contract-entries';

let contractsRepository: InMemoryContractsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: GenerateContractEntriesUseCase;

describe('GenerateContractEntriesUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryContractsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GenerateContractEntriesUseCase(
      contractsRepository,
      financeEntriesRepository,
    );
  });

  it('should generate monthly payable entries from startDate to endDate', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-001',
      title: 'Contrato Mensal',
      companyName: 'Empresa X',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      categoryId: 'cat-1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    // 11 payments: Feb 1 through Dec 1 (first payment is 1 period after startDate)
    expect(result.entriesCreated).toBe(11);
    expect(result.totalEntries).toBe(11);

    // Check all entries are PAYABLE
    for (const entry of financeEntriesRepository.items) {
      expect(entry.type).toBe('PAYABLE');
      expect(entry.expectedAmount).toBe(1000);
      expect(entry.contractId).toBe(contract.id.toString());
    }
  });

  it('should generate quarterly entries', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-002',
      title: 'Contrato Trimestral',
      companyName: 'Empresa Y',
      totalValue: 24000,
      paymentFrequency: 'QUARTERLY',
      paymentAmount: 6000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      categoryId: 'cat-1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    // 3 quarterly payments: Apr 1, Jul 1, Oct 1 (first payment is 1 period after startDate)
    expect(result.entriesCreated).toBe(3);
  });

  it('should be idempotent -- running twice does not create duplicates', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-003',
      title: 'Contrato Idempotente',
      companyName: 'Empresa Z',
      totalValue: 3000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      categoryId: 'cat-1',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    const secondRun = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    // Monthly from Jan 1 to Mar 31: Feb 1, Mar 1 = 2 entries
    expect(secondRun.entriesCreated).toBe(0);
    expect(secondRun.totalEntries).toBe(2);
    expect(financeEntriesRepository.items).toHaveLength(2);
  });

  it('should throw for non-existent contract', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw for cancelled contract', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-004',
      title: 'Contrato Cancelado',
      companyName: 'Empresa W',
      totalValue: 1000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: 'CANCELLED',
      categoryId: 'cat-1',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: contract.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw if contract has no categoryId', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-005',
      title: 'Contrato Sem Categoria',
      companyName: 'Empresa V',
      totalValue: 1000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 100,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: contract.id.toString(),
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
