import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { ListFiscalDocumentsUseCase } from './list-fiscal-documents';

let fiscalDocumentsRepository: InMemoryFiscalDocumentsRepository;
let sut: ListFiscalDocumentsUseCase;

const TENANT_ID = 'tenant-1';

function createDocument(
  overrides: Partial<{
    type: 'NFE' | 'NFCE';
    status: 'AUTHORIZED' | 'CANCELLED' | 'DRAFT';
    number: number;
  }> = {},
): FiscalDocument {
  return FiscalDocument.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    configId: new UniqueEntityID('config-1'),
    type: overrides.type ?? 'NFE',
    series: 1,
    number: overrides.number ?? 1,
    status: overrides.status ?? 'AUTHORIZED',
    recipientCnpjCpf: '12345678000195',
    recipientName: 'Cliente Teste',
    naturezaOperacao: 'Venda',
    cfop: '5102',
    totalProducts: 100,
    totalValue: 100,
  });
}

describe('List Fiscal Documents Use Case', () => {
  beforeEach(() => {
    fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
    sut = new ListFiscalDocumentsUseCase(fiscalDocumentsRepository);
  });

  it('should list fiscal documents with pagination', async () => {
    for (let i = 1; i <= 25; i++) {
      fiscalDocumentsRepository.items.push(createDocument({ number: i }));
    }

    const firstPage = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 10,
    });

    expect(firstPage.documents).toHaveLength(10);
    expect(firstPage.total).toBe(25);
    expect(firstPage.totalPages).toBe(3);
  });

  it('should filter by document type', async () => {
    fiscalDocumentsRepository.items.push(
      createDocument({ type: 'NFE', number: 1 }),
    );
    fiscalDocumentsRepository.items.push(
      createDocument({ type: 'NFCE', number: 2 }),
    );
    fiscalDocumentsRepository.items.push(
      createDocument({ type: 'NFE', number: 3 }),
    );

    const nfeOnly = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      type: 'NFE',
    });

    expect(nfeOnly.documents).toHaveLength(2);
    expect(nfeOnly.documents.every((doc) => doc.type === 'NFE')).toBe(true);
  });

  it('should filter by status', async () => {
    fiscalDocumentsRepository.items.push(
      createDocument({ status: 'AUTHORIZED', number: 1 }),
    );
    fiscalDocumentsRepository.items.push(
      createDocument({ status: 'CANCELLED', number: 2 }),
    );

    const authorizedOnly = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
      status: 'AUTHORIZED',
    });

    expect(authorizedOnly.documents).toHaveLength(1);
    expect(authorizedOnly.documents[0].status).toBe('AUTHORIZED');
  });

  it('should return empty list for another tenant', async () => {
    fiscalDocumentsRepository.items.push(createDocument());

    const otherTenantDocs = await sut.execute({
      tenantId: 'other-tenant',
      page: 1,
      limit: 20,
    });

    expect(otherTenantDocs.documents).toHaveLength(0);
    expect(otherTenantDocs.total).toBe(0);
  });
});
