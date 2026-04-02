import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FiscalConfig } from '@/entities/fiscal/fiscal-config';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFiscalConfigsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-configs-repository';
import { InMemoryFiscalDocumentItemsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-document-items-repository';
import { InMemoryFiscalDocumentsRepository } from '@/repositories/fiscal/in-memory/in-memory-fiscal-documents-repository';
import type {
  EmissionResult,
  FiscalProvider,
} from '@/services/fiscal/fiscal-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmitNfeFromEntryUseCase } from './emit-nfe-from-entry';

// Mock fiscal provider
function createMockFiscalProvider(
  overrides?: Partial<EmissionResult>,
): FiscalProvider {
  return {
    providerName: 'MOCK',
    emitNFe: vi.fn().mockResolvedValue({
      success: true,
      accessKey: '12345678901234567890123456789012345678901234',
      protocolNumber: 'PROTO-123',
      protocolDate: new Date(),
      xmlAuthorized: '<xml>authorized</xml>',
      externalId: 'ext-123',
      ...overrides,
    }),
    emitNFCe: vi.fn(),
    cancelDocument: vi.fn(),
    correctionLetter: vi.fn(),
    voidNumberRange: vi.fn(),
    queryDocument: vi.fn(),
    generateDanfe: vi.fn(),
    checkSefazStatus: vi.fn(),
  };
}

const TENANT_ID = 'tenant-123';

describe('EmitNfeFromEntryUseCase', () => {
  let entriesRepo: InMemoryFinanceEntriesRepository;
  let fiscalConfigsRepo: InMemoryFiscalConfigsRepository;
  let fiscalDocumentsRepo: InMemoryFiscalDocumentsRepository;
  let fiscalDocItemsRepo: InMemoryFiscalDocumentItemsRepository;
  let fiscalProvider: FiscalProvider;
  let sut: EmitNfeFromEntryUseCase;

  beforeEach(async () => {
    entriesRepo = new InMemoryFinanceEntriesRepository();
    fiscalConfigsRepo = new InMemoryFiscalConfigsRepository();
    fiscalDocumentsRepo = new InMemoryFiscalDocumentsRepository();
    fiscalDocItemsRepo = new InMemoryFiscalDocumentItemsRepository();
    fiscalProvider = createMockFiscalProvider();

    sut = new EmitNfeFromEntryUseCase(
      entriesRepo,
      fiscalConfigsRepo,
      fiscalDocumentsRepo,
      fiscalDocItemsRepo,
      fiscalProvider,
    );

    // Seed fiscal config
    const config = FiscalConfig.create({
      tenantId: new UniqueEntityID(TENANT_ID),
      provider: 'NUVEM_FISCAL',
      environment: 'HOMOLOGATION',
      apiKey: 'test-api-key',
      defaultCfop: '5102',
      defaultNaturezaOperacao: 'Venda de Mercadoria',
      taxRegime: 'SIMPLES_NACIONAL',
    });
    await fiscalConfigsRepo.create(config);
  });

  async function createReceivableEntry(
    overrides?: Record<string, unknown>,
  ): Promise<string> {
    const entry = await entriesRepo.create({
      tenantId: TENANT_ID,
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de produto',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 1000,
      issueDate: new Date(),
      dueDate: new Date(),
      customerName: 'Cliente Teste',
      beneficiaryCpfCnpj: '12345678901',
      ...overrides,
    });
    return entry.id.toString();
  }

  const defaultItems = [
    {
      description: 'Produto A',
      quantity: 2,
      unitPrice: 250,
      ncm: '84714900',
      cfop: '5102',
    },
    {
      description: 'Produto B',
      quantity: 1,
      unitPrice: 500,
      ncm: '84714900',
      cfop: '5102',
    },
  ];

  it('should emit NFE successfully for a receivable entry', async () => {
    const entryId = await createReceivableEntry();

    const result = await sut.execute({
      entryId,
      tenantId: TENANT_ID,
      documentType: 'NFE',
      items: defaultItems,
    });

    expect(result.fiscalDocument).toBeDefined();
    expect(result.fiscalDocument.type).toBe('NFE');
    expect(result.fiscalDocument.status).toBe('AUTHORIZED');
    expect(result.fiscalDocument.accessKey).toBeDefined();
    expect(result.fiscalDocument.protocolNumber).toBe('PROTO-123');
    expect(result.fiscalDocument.totalValue).toBe(1000);

    // Verify the entry was updated with the fiscal document ID
    const updatedEntry = await entriesRepo.findById(
      new UniqueEntityID(entryId),
      TENANT_ID,
    );
    expect(updatedEntry?.fiscalDocumentId).toBe(result.fiscalDocument.id);

    // Verify fiscal document was persisted
    expect(fiscalDocumentsRepo.items).toHaveLength(1);

    // Verify items were persisted
    expect(fiscalDocItemsRepo.items).toHaveLength(2);

    // Verify provider was called
    expect(fiscalProvider.emitNFe).toHaveBeenCalledOnce();
  });

  it('should emit NFSE successfully for a receivable entry', async () => {
    const entryId = await createReceivableEntry();

    const result = await sut.execute({
      entryId,
      tenantId: TENANT_ID,
      documentType: 'NFSE',
      items: [
        {
          description: 'Consultoria',
          quantity: 10,
          unitPrice: 100,
          issRate: 5,
        },
      ],
      notes: 'Informações adicionais da NFS-e',
    });

    expect(result.fiscalDocument).toBeDefined();
    expect(result.fiscalDocument.type).toBe('NFSE');
    expect(result.fiscalDocument.status).toBe('AUTHORIZED');
    expect(result.fiscalDocument.totalValue).toBe(1000);
  });

  it('should throw when entry is not found', async () => {
    await expect(
      sut.execute({
        entryId: 'nonexistent-id',
        tenantId: TENANT_ID,
        documentType: 'NFE',
        items: defaultItems,
      }),
    ).rejects.toThrow('Finance entry not found');
  });

  it('should throw when fiscal config is not configured', async () => {
    // Clear fiscal configs
    fiscalConfigsRepo.items = [];

    const entryId = await createReceivableEntry();

    await expect(
      sut.execute({
        entryId,
        tenantId: TENANT_ID,
        documentType: 'NFE',
        items: defaultItems,
      }),
    ).rejects.toThrow('Fiscal configuration not found');
  });

  it('should throw when entry type is PAYABLE', async () => {
    const entry = await entriesRepo.create({
      tenantId: TENANT_ID,
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a pagar',
      categoryId: 'cat-1',
      costCenterId: 'cc-1',
      expectedAmount: 500,
      issueDate: new Date(),
      dueDate: new Date(),
    });

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: TENANT_ID,
        documentType: 'NFE',
        items: defaultItems,
      }),
    ).rejects.toThrow('Only receivable entries can emit fiscal documents');
  });

  it('should throw when entry already has a fiscal document', async () => {
    const entryId = await createReceivableEntry();

    // First emission
    await sut.execute({
      entryId,
      tenantId: TENANT_ID,
      documentType: 'NFE',
      items: defaultItems,
    });

    // Second emission should fail
    await expect(
      sut.execute({
        entryId,
        tenantId: TENANT_ID,
        documentType: 'NFE',
        items: defaultItems,
      }),
    ).rejects.toThrow('This entry already has a fiscal document linked');
  });

  it('should throw when emission fails at provider', async () => {
    const failingProvider = createMockFiscalProvider({
      success: false,
      errorMessage: 'SEFAZ rejection: invalid CNPJ',
    });

    const failingSut = new EmitNfeFromEntryUseCase(
      entriesRepo,
      fiscalConfigsRepo,
      fiscalDocumentsRepo,
      fiscalDocItemsRepo,
      failingProvider,
    );

    const entryId = await createReceivableEntry();

    await expect(
      failingSut.execute({
        entryId,
        tenantId: TENANT_ID,
        documentType: 'NFE',
        items: defaultItems,
      }),
    ).rejects.toThrow('Fiscal emission failed: SEFAZ rejection: invalid CNPJ');

    // Document should be persisted with DENIED status
    expect(fiscalDocumentsRepo.items).toHaveLength(1);
    expect(fiscalDocumentsRepo.items[0].status).toBe('DENIED');
  });

  it('should throw when items array is empty', async () => {
    const entryId = await createReceivableEntry();

    await expect(
      sut.execute({
        entryId,
        tenantId: TENANT_ID,
        documentType: 'NFE',
        items: [],
      }),
    ).rejects.toThrow(
      'At least one item is required to emit a fiscal document',
    );
  });
});
