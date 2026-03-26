import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Bid } from '@/entities/sales/bid';
import { InMemoryBidsRepository } from '@/repositories/sales/in-memory/in-memory-bids-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBidsUseCase } from './list-bids';

let bidsRepository: InMemoryBidsRepository;
let sut: ListBidsUseCase;

const TENANT_ID = 'tenant-1';

function createTestBid(
  overrides?: Partial<{ status: string; modality: string; organState: string }>,
): Bid {
  return Bid.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    portalName: 'ComprasNet',
    editalNumber: `PE-${Math.random().toString(36).substring(7)}/2026`,
    modality: (overrides?.modality as Bid['modality']) ?? 'PREGAO_ELETRONICO',
    criterionType: 'MENOR_PRECO',
    legalFramework: 'LEI_14133_2021',
    object: 'Aquisicao de materiais',
    organName: 'Prefeitura SP',
    organState: overrides?.organState,
    openingDate: new Date('2026-04-15'),
    status: (overrides?.status as Bid['status']) ?? undefined,
  });
}

describe('ListBidsUseCase', () => {
  beforeEach(() => {
    bidsRepository = new InMemoryBidsRepository();
    sut = new ListBidsUseCase(bidsRepository);
  });

  it('should list bids with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      bidsRepository.items.push(createTestBid());
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(result.bids).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });

  it('should filter by status', async () => {
    bidsRepository.items.push(createTestBid({ status: 'ANALYZING' }));
    bidsRepository.items.push(createTestBid({ status: 'WON' }));
    bidsRepository.items.push(createTestBid({ status: 'ANALYZING' }));

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      status: 'ANALYZING',
    });

    expect(result.bids).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should return empty list for tenant with no bids', async () => {
    const result = await sut.execute({
      tenantId: 'empty-tenant',
      page: 1,
      limit: 20,
    });

    expect(result.bids).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
