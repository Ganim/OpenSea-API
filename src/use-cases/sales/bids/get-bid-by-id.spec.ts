import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import { InMemoryBidsRepository } from '@/repositories/sales/in-memory/in-memory-bids-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetBidByIdUseCase } from './get-bid-by-id';

let bidsRepository: InMemoryBidsRepository;
let sut: GetBidByIdUseCase;

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
    },
    new UniqueEntityID(id),
  );
}

describe('GetBidByIdUseCase', () => {
  beforeEach(() => {
    bidsRepository = new InMemoryBidsRepository();
    sut = new GetBidByIdUseCase(bidsRepository);
  });

  it('should return a bid by id', async () => {
    const bid = createTestBid('bid-1');
    bidsRepository.items.push(bid);

    const { bid: foundBid } = await sut.execute({
      id: 'bid-1',
      tenantId: TENANT_ID,
    });

    expect(foundBid).toBeDefined();
    expect(foundBid.id.toString()).toBe('bid-1');
    expect(foundBid.editalNumber).toBe('PE-001/2026');
  });

  it('should throw when bid is not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not return a deleted bid', async () => {
    const bid = createTestBid('bid-2');
    bid.delete();
    bidsRepository.items.push(bid);

    await expect(() =>
      sut.execute({ id: 'bid-2', tenantId: TENANT_ID }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
