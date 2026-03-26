import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentItemsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-items-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import type { FiscalProvider } from '@/services/fiscal/fiscal-provider.interface';
import { EmitNFCeUseCase } from './emit-nfce';

let fiscalConfigsRepository: InMemoryFiscalConfigsRepository;
let fiscalDocumentsRepository: InMemoryFiscalDocumentsRepository;
let fiscalDocumentItemsRepository: InMemoryFiscalDocumentItemsRepository;
let fiscalDocumentEventsRepository: InMemoryFiscalDocumentEventsRepository;
let mockProvider: FiscalProvider;
let sut: EmitNFCeUseCase;

const TENANT_ID = 'tenant-1';

function createFiscalConfig(
  overrides?: Partial<{ nfceEnabled: boolean }>,
): FiscalConfig {
  return FiscalConfig.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    provider: 'NUVEM_FISCAL',
    environment: 'HOMOLOGATION',
    apiKey: 'test-key',
    defaultCfop: '5102',
    defaultNaturezaOperacao: 'Venda de Mercadoria',
    taxRegime: 'SIMPLES_NACIONAL',
    nfceEnabled: overrides?.nfceEnabled ?? true,
  });
}

describe('Emit NFC-e Use Case', () => {
  beforeEach(() => {
    fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
    fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
    fiscalDocumentItemsRepository = new InMemoryFiscalDocumentItemsRepository();
    fiscalDocumentEventsRepository =
      new InMemoryFiscalDocumentEventsRepository();

    mockProvider = {
      providerName: 'MOCK',
      emitNFe: vi.fn(),
      emitNFCe: vi.fn().mockResolvedValue({
        success: true,
        accessKey: '35260312345678000195650010000000011000000011',
        protocolNumber: '135260300000002',
        protocolDate: new Date(),
        xmlAuthorized: '<nfeProc>...</nfeProc>',
        externalId: 'ext-nfce-123',
      }),
      cancelDocument: vi.fn(),
      correctionLetter: vi.fn(),
      voidNumberRange: vi.fn(),
      queryDocument: vi.fn(),
      generateDanfe: vi.fn(),
      checkSefazStatus: vi.fn(),
    };

    sut = new EmitNFCeUseCase(
      fiscalConfigsRepository,
      fiscalDocumentsRepository,
      fiscalDocumentItemsRepository,
      fiscalDocumentEventsRepository,
      mockProvider,
    );
  });

  it('should emit an NFC-e successfully', async () => {
    fiscalConfigsRepository.items.push(createFiscalConfig());

    const { fiscalDocument } = await sut.execute({
      tenantId: TENANT_ID,
      recipientCnpjCpf: '12345678901',
      recipientName: 'Consumidor Final',
      items: [
        {
          productName: 'Camiseta Algodao',
          productCode: 'CAM-001',
          ncm: '61091000',
          cfop: '5102',
          quantity: 2,
          unitPrice: 59.9,
          cst: '102',
        },
      ],
    });

    expect(fiscalDocument.status).toBe('AUTHORIZED');
    expect(fiscalDocument.type).toBe('NFCE');
    expect(fiscalDocument.number).toBe(1);
    expect(fiscalDocument.accessKey).toBeDefined();
    expect(fiscalDocument.protocolNumber).toBeDefined();
    expect(fiscalDocument.totalProducts).toBe(119.8);
    expect(fiscalDocumentsRepository.items).toHaveLength(1);
    expect(fiscalDocumentItemsRepository.items).toHaveLength(1);
    expect(fiscalDocumentEventsRepository.items).toHaveLength(1);
    expect(fiscalDocumentEventsRepository.items[0].success).toBe(true);
  });

  it('should throw when fiscal config is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        recipientCnpjCpf: '12345678901',
        recipientName: 'Consumidor',
        items: [
          {
            productName: 'Produto',
            productCode: 'P001',
            ncm: '61091000',
            quantity: 1,
            unitPrice: 100,
            cst: '102',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw when NFC-e is not enabled', async () => {
    fiscalConfigsRepository.items.push(
      createFiscalConfig({ nfceEnabled: false }),
    );

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        recipientCnpjCpf: '12345678901',
        recipientName: 'Consumidor',
        items: [
          {
            productName: 'Produto',
            productCode: 'P001',
            ncm: '61091000',
            quantity: 1,
            unitPrice: 100,
            cst: '102',
          },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw when items list is empty', async () => {
    fiscalConfigsRepository.items.push(createFiscalConfig());

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        recipientCnpjCpf: '12345678901',
        recipientName: 'Consumidor',
        items: [],
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should handle emission failure from provider', async () => {
    fiscalConfigsRepository.items.push(createFiscalConfig());

    (mockProvider.emitNFCe as ReturnType<typeof vi.fn>).mockResolvedValue({
      success: false,
      errorCode: '694',
      errorMessage: 'Schema validation error',
    });

    const { fiscalDocument } = await sut.execute({
      tenantId: TENANT_ID,
      recipientCnpjCpf: '12345678901',
      recipientName: 'Consumidor',
      items: [
        {
          productName: 'Produto',
          productCode: 'P001',
          ncm: '61091000',
          quantity: 1,
          unitPrice: 100,
          cst: '102',
        },
      ],
    });

    expect(fiscalDocument.status).toBe('DENIED');
    expect(fiscalDocumentEventsRepository.items[0].success).toBe(false);
    expect(fiscalDocumentEventsRepository.items[0].errorCode).toBe('694');
  });
});
