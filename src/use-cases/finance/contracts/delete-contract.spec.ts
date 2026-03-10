import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryContractsRepository } from '@/repositories/finance/in-memory/in-memory-contracts-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteContractUseCase } from './delete-contract';

let contractsRepository: InMemoryContractsRepository;
let financeEntriesRepository: InMemoryFinanceEntriesRepository;
let sut: DeleteContractUseCase;

describe('DeleteContractUseCase', () => {
  beforeEach(() => {
    contractsRepository = new InMemoryContractsRepository();
    financeEntriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new DeleteContractUseCase(contractsRepository, financeEntriesRepository);
  });

  it('should soft delete a contract', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-001',
      title: 'Contrato Para Excluir',
      companyName: 'Empresa A',
      totalValue: 12000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
    });

    await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    const deleted = contractsRepository.items.find(
      (c) => c.id.toString() === contract.id.toString(),
    );
    expect(deleted?.deletedAt).toBeDefined();
  });

  it('should cancel pending finance entries linked to the contract', async () => {
    const contract = await contractsRepository.create({
      tenantId: 'tenant-1',
      code: 'CTR-002',
      title: 'Contrato Com Lancamentos',
      companyName: 'Empresa B',
      totalValue: 3000,
      paymentFrequency: 'MONTHLY',
      paymentAmount: 1000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-03-31'),
      categoryId: 'cat-1',
    });

    // Create pending entries linked to contract
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
        status: 'PENDING',
      });
    }

    // Also create a PAID entry that should NOT be cancelled
    await financeEntriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Parcela paga',
      categoryId: 'cat-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-15'),
      contractId: contract.id.toString(),
      status: 'PAID',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      contractId: contract.id.toString(),
    });

    // 3 PENDING entries should now be CANCELLED
    const cancelledEntries = financeEntriesRepository.items.filter(
      (e) => e.status === 'CANCELLED',
    );
    expect(cancelledEntries).toHaveLength(3);

    // 1 PAID entry should remain PAID
    const paidEntries = financeEntriesRepository.items.filter(
      (e) => e.status === 'PAID',
    );
    expect(paidEntries).toHaveLength(1);
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
