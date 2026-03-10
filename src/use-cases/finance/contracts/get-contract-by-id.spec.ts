import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetContractByIdUseCase } from './get-contract-by-id';

let contractsRepository: InMemoryContractsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: GetContractByIdUseCase;

describe('GetContractByIdUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryContractsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new GetContractByIdUseCase(contractsRepository, financeEntriesRepository);
  });

  it('should return a contract with generated entries count', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-001',
      title: 'Contrato Teste',
      companyName: 'Empresa A',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      categoryId: 'cat-1',
    });

    // Create some linked entries
    for (let i = 0; i < 3; i++) {
      await financeEntriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAG-00${i + 1}`,
        description: `Parcela ${i + 1}`,
        categoryId: 'cat-1',
        expectedAmount: 1000,
        issueDate: new Date('2026-01-01'),
        dueDate: new Date(2026, i + 1, 1),
        contractId: contract.id.toString(),
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    expect(result.contract.title).toBe('Contrato Teste');
    expect(result.generatedEntriesCount).toBe(3);
  });

  it('should return next payment date from pending entries', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-002',
      title: 'Contrato Proximo Pagamento',
      companyName: 'Empresa B',
      totalValue: 6000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-06-30'),
      categoryId: 'cat-1',
    });

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);

    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Proxima parcela',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: futureDate,
      contractId: contract.id.toString(),
      status: 'PENDING',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    expect(result.nextPaymentDate).toBeDefined();
  });

  it('should throw for non-existent contract', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        contractId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
