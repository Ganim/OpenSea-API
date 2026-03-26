import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidContract } from '@/entities/sales/bid-contract';
import { InMemoryBidContractsRepository } from '@/repositories/sales/in-memory/in-memory-bid-contracts-repository';
import { InMemoryBidEmpenhosRepository } from '@/repositories/sales/in-memory/in-memory-bid-empenhos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBidEmpenhoUseCase } from './create-bid-empenho';

let bidContractsRepository: InMemoryBidContractsRepository;
let bidEmpenhosRepository: InMemoryBidEmpenhosRepository;
let sut: CreateBidEmpenhoUseCase;

const TENANT_ID = 'tenant-1';

function createTestContract(id: string): BidContract {
  return BidContract.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      bidId: new UniqueEntityID('bid-1'),
      contractNumber: 'CT-001/2026',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-05-01'),
      totalValue: 500000,
      remainingValue: 500000,
      customerId: new UniqueEntityID('customer-1'),
    },
    new UniqueEntityID(id),
  );
}

describe('CreateBidEmpenhoUseCase', () => {
  beforeEach(() => {
    bidContractsRepository = new InMemoryBidContractsRepository();
    bidEmpenhosRepository = new InMemoryBidEmpenhosRepository();
    sut = new CreateBidEmpenhoUseCase(
      bidContractsRepository,
      bidEmpenhosRepository,
    );
  });

  it('should create an empenho for a contract', async () => {
    bidContractsRepository.items.push(createTestContract('contract-1'));

    const { empenho } = await sut.execute({
      tenantId: TENANT_ID,
      contractId: 'contract-1',
      empenhoNumber: '2026NE000123',
      type: 'ORDINARIO',
      value: 50000,
      issueDate: new Date('2026-05-10'),
    });

    expect(empenho).toBeDefined();
    expect(empenho.empenhoNumber).toBe('2026NE000123');
    expect(empenho.type).toBe('ORDINARIO');
    expect(empenho.value).toBe(50000);
    expect(empenho.status).toBe('EMITIDO');
    expect(bidEmpenhosRepository.items).toHaveLength(1);
  });

  it('should throw when contract is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        contractId: 'non-existent',
        empenhoNumber: '2026NE000124',
        type: 'ORDINARIO',
        value: 50000,
        issueDate: new Date(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when empenho number is empty', async () => {
    bidContractsRepository.items.push(createTestContract('contract-2'));

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        contractId: 'contract-2',
        empenhoNumber: '  ',
        type: 'ORDINARIO',
        value: 50000,
        issueDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when empenho number already exists', async () => {
    bidContractsRepository.items.push(createTestContract('contract-3'));

    await sut.execute({
      tenantId: TENANT_ID,
      contractId: 'contract-3',
      empenhoNumber: '2026NE000125',
      type: 'ORDINARIO',
      value: 50000,
      issueDate: new Date(),
    });

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        contractId: 'contract-3',
        empenhoNumber: '2026NE000125',
        type: 'ESTIMATIVO',
        value: 30000,
        issueDate: new Date(),
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
