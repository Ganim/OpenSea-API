import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import { InMemoryBidHistoryRepository } from '@/repositories/sales/in-memory/in-memory-bid-history-repository';
import { InMemoryBidsRepository } from '@/repositories/sales/in-memory/in-memory-bids-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateBidUseCase } from './update-bid';

let bidsRepository: InMemoryBidsRepository;
let bidHistoryRepository: InMemoryBidHistoryRepository;
let sut: UpdateBidUseCase;

const TENANT_ID = 'tenant-1';

function createTestBid(overrides?: Partial<{ id: string }>): Bid {
  return Bid.create(
    {
      tenantId: new UniqueEntityID(TENANT_ID),
      portalName: 'ComprasNet',
      editalNumber: 'PE-001/2026',
      modality: 'PREGAO_ELETRONICO',
      criterionType: 'MENOR_PRECO',
      legalFramework: 'LEI_14133_2021',
      object: 'Aquisicao de materiais de escritorio',
      organName: 'Prefeitura Municipal de Sao Paulo',
      openingDate: new Date('2026-04-15'),
    },
    overrides?.id ? new UniqueEntityID(overrides.id) : undefined,
  );
}

describe('UpdateBidUseCase', () => {
  beforeEach(() => {
    bidsRepository = new InMemoryBidsRepository();
    bidHistoryRepository = new InMemoryBidHistoryRepository();
    sut = new UpdateBidUseCase(bidsRepository, bidHistoryRepository);
  });

  it('should update bid fields successfully', async () => {
    const bid = createTestBid({ id: 'bid-1' });
    bidsRepository.items.push(bid);

    const { bid: updatedBid } = await sut.execute({
      id: 'bid-1',
      tenantId: TENANT_ID,
      object: 'Aquisicao de equipamentos de TI',
      ourProposalValue: 150000,
      tags: ['urgente', 'ti'],
    });

    expect(updatedBid.object).toBe('Aquisicao de equipamentos de TI');
    expect(updatedBid.ourProposalValue).toBe(150000);
    expect(updatedBid.tags).toEqual(['urgente', 'ti']);
  });

  it('should throw when bid is not found', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent',
        tenantId: TENANT_ID,
        object: 'Updated object',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should create history entry when status changes', async () => {
    const bid = createTestBid({ id: 'bid-2' });
    bidsRepository.items.push(bid);

    await sut.execute({
      id: 'bid-2',
      tenantId: TENANT_ID,
      status: 'ANALYZING',
      userId: 'user-1',
    });

    expect(bidHistoryRepository.items).toHaveLength(1);
    expect(bidHistoryRepository.items[0].action).toBe('BID_STATUS_CHANGED');
  });

  it('should not create history entry when status does not change', async () => {
    const bid = createTestBid({ id: 'bid-3' });
    bidsRepository.items.push(bid);

    await sut.execute({
      id: 'bid-3',
      tenantId: TENANT_ID,
      notes: 'Some notes',
    });

    expect(bidHistoryRepository.items).toHaveLength(0);
  });
});
