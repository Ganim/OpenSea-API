import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import { FiscalDocument } from '@/entities/fiscal/fiscal-document';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentEventsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-events-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import type { FiscalProvider } from '@/services/fiscal/fiscal-provider.interface';
import { CorrectionLetterUseCase } from './correction-letter';

let fiscalConfigsRepository: InMemoryFiscalConfigsRepository;
let fiscalDocumentsRepository: InMemoryFiscalDocumentsRepository;
let fiscalDocumentEventsRepository: InMemoryFiscalDocumentEventsRepository;
let mockProvider: FiscalProvider;
let sut: CorrectionLetterUseCase;

const TENANT_ID = 'tenant-1';
const CONFIG_ID = 'config-1';

function createAuthorizedNFe(): FiscalDocument {
  return FiscalDocument.create({
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
}

describe('Correction Letter Use Case', () => {
  beforeEach(() => {
    fiscalConfigsRepository = new InMemoryFiscalConfigsRepository();
    fiscalDocumentsRepository = new InMemoryFiscalDocumentsRepository();
    fiscalDocumentEventsRepository =
      new InMemoryFiscalDocumentEventsRepository();

    mockProvider = {
      providerName: 'MOCK',
      emitNFe: vi.fn(),
      emitNFCe: vi.fn(),
      cancelDocument: vi.fn(),
      correctionLetter: vi.fn().mockResolvedValue({
        success: true,
        protocol: 'cce-proto-123',
        xml: '<procEventoNFe>...</procEventoNFe>',
      }),
      voidNumberRange: vi.fn(),
      queryDocument: vi.fn(),
      generateDanfe: vi.fn(),
      checkSefazStatus: vi.fn(),
    };

    sut = new CorrectionLetterUseCase(
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

  it('should send a correction letter for an authorized NF-e', async () => {
    const document = createAuthorizedNFe();
    fiscalDocumentsRepository.items.push(document);

    const correctionText =
      'Correcao do endereco de entrega conforme solicitado pelo cliente';

    const { fiscalDocument } = await sut.execute({
      tenantId: TENANT_ID,
      documentId: document.id.toString(),
      correctionText,
    });

    expect(fiscalDocument.status).toBe('CORRECTED');
    expect(fiscalDocument.correctionText).toBe(correctionText);
    expect(fiscalDocumentEventsRepository.items).toHaveLength(1);
    expect(fiscalDocumentEventsRepository.items[0].type).toBe(
      'CORRECTION_LETTER',
    );
  });

  it('should throw when document is not found', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: 'non-existent',
        correctionText: 'Correcao de endereco do destinatario',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw when correction text is too short', async () => {
    const document = createAuthorizedNFe();
    fiscalDocumentsRepository.items.push(document);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: document.id.toString(),
        correctionText: 'Short text',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw when document is NFC-e', async () => {
    const nfceDocument = FiscalDocument.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      configId: new UniqueEntityID(CONFIG_ID),
      type: 'NFCE',
      series: 1,
      number: 1,
      status: 'AUTHORIZED',
      recipientCnpjCpf: '12345678901',
      recipientName: 'Consumidor',
      naturezaOperacao: 'Venda',
      cfop: '5102',
      totalProducts: 50,
      totalValue: 50,
      accessKey: '35260312345678000195650010000000011000000011',
    });
    fiscalDocumentsRepository.items.push(nfceDocument);

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        documentId: nfceDocument.id.toString(),
        correctionText: 'Correcao de endereco do destinatario',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
