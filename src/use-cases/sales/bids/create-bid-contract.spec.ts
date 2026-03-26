import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import { InMemoryBidContractsRepository } from '@/repositories/sales/in-memory/in-memory-bid-contracts-repository';
import { InMemoryBidHistoryRepository } from '@/repositories/sales/in-memory/in-memory-bid-history-repository';
import { InMemoryBidsRepository } from '@/repositories/sales/in-memory/in-memory-bids-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBidContractUseCase } from './create-bid-contract';

let bidsRepository: InMemoryBidsRepository;
let bidContractsRepository: InMemoryBidContractsRepository;
let bidHistoryRepository: InMemoryBidHistoryRepository;
let sut: CreateBidContractUseCase;

const TENANT_ID = 'tenant-1';

function createTestBid(id: string): Bid {
  return Bid.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      portalName: 'ComprasNet',
      editalNumber: 'PE-001/2026',
      modality: 'PREGAO_ELETRONICO',
      criterionType: 'MENOR_PRECO',
      legalFramework: 'LEI_14133_2021',
      object: 'Aquisicao de materiais',
      organName: 'Prefeitura SP',
      openingDate: new Date('2026-04-15'),
      status: 'WON',
    },
    new UniqueEntityID(id),
  );
}

describe('CreateBidContractUseCase', () => {
  beforeEach(() => {
    bidsRepository = new InMemoryBidsRepository();
    bidContractsRepository = new InMemoryBidContractsRepository();
    bidHistoryRepository = new InMemoryBidHistoryRepository();
    sut = new CreateBidContractUseCase(
      bidsRepository,
      bidContractsRepository,
      bidHistoryRepository,
    );
  });

  it('should create a contract for a bid', async () => {
    bidsRepository.items.push(createTestBid('bid-1'));

    const { contract } = await sut.execute({
      tenantId: TENANT_ID,
      bidId: 'bid-1',
      contractNumber: 'CT-001/2026',
      startDate: new Date('2026-05-01'),
      endDate: new Date('2027-05-01'),
      totalValue: 500000,
      customerId: 'customer-1',
      userId: 'user-1',
    });

    expect(contract).toBeDefined();
    expect(contract.contractNumber).toBe('CT-001/2026');
    expect(contract.totalValue).toBe(500000);
    expect(contract.remainingValue).toBe(500000);
    expect(contract.status).toBe('DRAFT_CONTRACT');
    expect(bidContractsRepository.items).toHaveLength(1);
    expect(bidHistoryRepository.items).toHaveLength(1);
    expect(bidHistoryRepository.items[0].action).toBe('BID_CONTRACT_CREATED');

    const updatedBid = bidsRepository.items[0];
    expect(updatedBid.status).toBe('CONTRACTED');
  });

  it('should throw when bid is not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bidId: 'non-existent',
        contractNumber: 'CT-002/2026',
        startDate: new Date(),
        endDate: new Date(),
        totalValue: 100000,
        customerId: 'customer-1',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw when contract number is empty', async () => {
    bidsRepository.items.push(createTestBid('bid-2'));

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bidId: 'bid-2',
        contractNumber: '  ',
        startDate: new Date(),
        endDate: new Date(),
        totalValue: 100000,
        customerId: 'customer-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when contract number already exists', async () => {
    bidsRepository.items.push(createTestBid('bid-3'));
    bidsRepository.items.push(createTestBid('bid-4'));

    await sut.execute({
      tenantId: TENANT_ID,
      bidId: 'bid-3',
      contractNumber: 'CT-DUP/2026',
      startDate: new Date(),
      endDate: new Date(),
      totalValue: 100000,
      customerId: 'customer-1',
    });

    // Reset bid-4 status since bid-3 changed to CONTRACTED
    bidsRepository.items[1].status = 'WON';

    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bidId: 'bid-4',
        contractNumber: 'CT-DUP/2026',
        startDate: new Date(),
        endDate: new Date(),
        totalValue: 200000,
        customerId: 'customer-2',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
