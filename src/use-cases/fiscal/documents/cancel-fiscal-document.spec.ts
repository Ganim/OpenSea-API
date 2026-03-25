import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import type { FiscalProvider } from '@/services/fiscal/fiscal-provider.interface';
import { CancelFiscalDocumentUseCase } from './cancel-fiscal-document';

let fiscalConfigsRepository: InMemoryFiscalConfigsRepository;
let fiscalDocumentsRepository: InMemoryFiscalDocumentsRepository;
let fiscalDocumentEventsRepository: InMemoryFiscalDocumentEventsRepository;
let mockProvider: FiscalProvider;
let sut: CancelFiscalDocumentUseCase;

const TENANT_ID = 'tenant-1';
const CONFIG_ID = 'config-1';

function createAuthorizedDocument(): FiscalDocument {
  const document = FiscalDocument.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    configId: new UniqueEntityID(CONFIG_ID),
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
    accessKey: '35260312345678000195550010000000011000000011',
    protocolNumber: '135260300000001',
    protocolDate: new Date(),
  });
  return document;
}

describe('Cancel Fiscal Document Use Case', () => {
  beforeEach(() => {
    fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
    fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
    fiscalDocumentEventsRepository =
      new InMemoryFiscalDocumentEventsRepository();

    mockProvider = {
      providerName: 'MOCK',
      emitNFe: vi.fn(),
      emitNFCe: vi.fn(),
      cancelDocument: vi.fn().mockResolvedValue({
        success: true,
        protocol: 'cancel-proto-123',
        xml: '<cancProc>...</cancProc>',
      }),
      correctionLetter: vi.fn(),
      voidNumberRange: vi.fn(),
      queryDocument: vi.fn(),
      generateDanfe: vi.fn(),
      checkSefazStatus: vi.fn(),
    };

    sut = new CancelFiscalDocumentUseCase(
      fiscalConfigsRepository,
      fiscalDocumentsRepository,
      fiscalDocumentEventsRepository,
      mockProvider,
    );

    const config = FiscalConfig.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        provider: 'NUVEM_FISCAL',
        environment: 'HOMOLOGATION',
        apiKey: 'test-key',
        defaultCfop: '5102',
        defaultNaturezaOperacao: 'Venda',
        taxRegime: 'SIMPLES_NACIONAL',
      },
      new UniqueEntityID(CONFIG_ID),
    );
    fiscalConfigsRepository.items.push(config);
  });

  it('should cancel an authorized document', async () => {
    const document = createAuthorizedDocument();
    fiscalDocumentsRepository.items.push(document);

    const { fiscalDocument } = await sut.execute({
      tenantId: TENANT_ID,
      documentId: document.id.toString(),
      reason: 'Desistencia do comprador apos emissao',
    });

    expect(fiscalDocument.status).toBe('CANCELLED');
    expect(fiscalDocument.cancelReason).toBe(
      'Desistencia do comprador apos emissao',
    );
    expect(fiscalDocumentEventsRepository.items).toHaveLength(1);
    expect(fiscalDocumentEventsRepository.items[0].type).toBe('CANCELLATION');
  });

  it('should throw when document is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: 'non-existent',
        reason: 'Desistencia do comprador apos emissao',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw when reason is too short', async () => {
    const document = createAuthorizedDocument();
    fiscalDocumentsRepository.items.push(document);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: document.id.toString(),
        reason: 'Short',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw when document is not AUTHORIZED', async () => {
    const document = FiscalDocument.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      configId: new UniqueEntityID(CONFIG_ID),
      type: 'NFE',
      series: 1,
      number: 2,
      status: 'DRAFT',
      recipientCnpjCpf: '12345678000195',
      recipientName: 'Cliente Teste',
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
        reason: 'Desistencia do comprador apos emissao',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
