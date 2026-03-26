import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BidDocument } from '@/entities/sales/bid-document';
import { InMemoryBidDocumentsRepository } from '@/repositories/sales/in-memory/in-memory-bid-documents-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBidDocumentsUseCase } from './list-bid-documents';

let bidDocumentsRepository: InMemoryBidDocumentsRepository;
let sut: ListBidDocumentsUseCase;

const TENANT_ID = 'tenant-1';

function createTestDocument(
  overrides?: Partial<{ bidId: string; type: string }>,
): BidDocument {
  return BidDocument.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    bidId: overrides?.bidId ? new UniqueEntityID(overrides.bidId) : undefined,
    type: (overrides?.type ?? 'CERTIDAO_FEDERAL') as BidDocument['type'],
    name: 'Test Document',
    fileId: new UniqueEntityID(),
  });
}

describe('ListBidDocumentsUseCase', () => {
  beforeEach(() => {
    bidDocumentsRepository = new InMemoryBidDocumentsRepository();
    sut = new ListBidDocumentsUseCase(bidDocumentsRepository);
  });

  it('should list documents for a tenant', async () => {
    bidDocumentsRepository.items.push(createTestDocument({ bidId: 'bid-1' }));
    bidDocumentsRepository.items.push(createTestDocument({ bidId: 'bid-1' }));

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      bidId: 'bid-1',
    });

    expect(result.documents).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should filter by document type', async () => {
    bidDocumentsRepository.items.push(
      createTestDocument({ type: 'CERTIDAO_FEDERAL' }),
    );
    bidDocumentsRepository.items.push(
      createTestDocument({ type: 'CONTRATO_SOCIAL' }),
    );

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      type: 'CONTRATO_SOCIAL',
    });

    expect(result.documents).toHaveLength(1);
  });

  it('should paginate documents', async () => {
    for (let i = 0; i < 5; i++) {
      bidDocumentsRepository.items.push(createTestDocument());
    }

    const result = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 2,
    });

    expect(result.documents).toHaveLength(2);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(3);
  });
});
