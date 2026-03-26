import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import { InMemoryBidsRepository } from '@/repositories/sales/in-memory/in-memory-bids-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteBidUseCase } from './delete-bid';

let bidsRepository: InMemoryBidsRepository;
let sut: DeleteBidUseCase;

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

describe('DeleteBidUseCase', () => {
  beforeEach(() => {
    bidsRepository = new InMemoryBidsRepository();
    sut = new DeleteBidUseCase(bidsRepository);
  });

  it('should soft-delete a bid', async () => {
    const bid = createTestBid('bid-1');
    bidsRepository.items.push(bid);

    await sut.execute({ id: 'bid-1', tenantId: TENANT_ID });

    const found = await bidsRepository.findById(
      new UniqueEntityID('bid-1'),
      TENANT_ID,
    );
    expect(found).toBeNull();
    expect(bidsRepository.items[0].isDeleted).toBe(true);
  });

  it('should throw when bid is not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent', tenantId: TENANT_ID }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
