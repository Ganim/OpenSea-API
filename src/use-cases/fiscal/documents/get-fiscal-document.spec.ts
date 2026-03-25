import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { FiscalDocumentEvent } from '@/entities/fiscal/fiscal-document-event';
import { FiscalDocumentItem } from '@/entities/fiscal/fiscal-document-item';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentItemsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-items-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import { GetFiscalDocumentUseCase } from './get-fiscal-document';

let fiscalDocumentsRepository: InMemoryFiscalDocumentsRepository;
let fiscalDocumentItemsRepository: InMemoryFiscalDocumentItemsRepository;
let fiscalDocumentEventsRepository: InMemoryFiscalDocumentEventsRepository;
let sut: GetFiscalDocumentUseCase;

const TENANT_ID = 'tenant-1';

describe('Get Fiscal Document Use Case', () => {
  beforeEach(() => {
    fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
    fiscalDocumentItemsRepository = new InMemoryFiscalDocumentItemsRepository();
    fiscalDocumentEventsRepository =
      new InMemoryFiscalDocumentEventsRepository();

    sut = new GetFiscalDocumentUseCase(
      fiscalDocumentsRepository,
      fiscalDocumentItemsRepository,
      fiscalDocumentEventsRepository,
    );
  });

  it('should return the document with items and events', async () => {
    const documentId = new UniqueEntityID();

    const document = FiscalDocument.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        configId: new UniqueEntityID('config-1'),
        type: 'NFE',
        series: 1,
        number: 1,
        status: 'AUTHORIZED',
        recipientCnpjCpf: '12345678000195',
        recipientName: 'Cliente Teste',
        naturezaOperacao: 'Venda',
        cfop: '5102',
        totalProducts: 100,
        totalValue: 100,
      },
      documentId,
    );
    fiscalDocumentsRepository.items.push(document);

    const documentItem = FiscalDocumentItem.create({
      fiscalDocumentId: documentId,
      itemNumber: 1,
      productName: 'Camiseta',
      productCode: 'CAM-001',
      ncm: '61091000',
      cfop: '5102',
      quantity: 2,
      unitPrice: 50,
      totalPrice: 100,
      cst: '102',
    });
    fiscalDocumentItemsRepository.items.push(documentItem);

    const documentEvent = FiscalDocumentEvent.create({
      fiscalDocumentId: documentId,
      type: 'AUTHORIZATION',
      description: 'NF-e authorized',
      success: true,
      protocol: '135260300000001',
    });
    fiscalDocumentEventsRepository.items.push(documentEvent);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      documentId: documentId.toString(),
    });

    expect(result.fiscalDocument.number).toBe(1);
    expect(result.documentItems).toHaveLength(1);
    expect(result.documentItems[0].productName).toBe('Camiseta');
    expect(result.documentEvents).toHaveLength(1);
    expect(result.documentEvents[0].type).toBe('AUTHORIZATION');
  });

  it('should throw when document is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: 'non-existent',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw when document belongs to another tenant', async () => {
    const document = FiscalDocument.create({
      tenantId: new UniqueEntityID('other-tenant'),
      configId: new UniqueEntityID('config-1'),
      type: 'NFE',
      series: 1,
      number: 1,
      recipientCnpjCpf: '12345678000195',
      recipientName: 'Cliente',
      naturezaOperacao: 'Venda',
      cfop: '5102',
      totalProducts: 100,
      totalValue: 100,
    });
    fiscalDocumentsRepository.items.push(document);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: document.id.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
