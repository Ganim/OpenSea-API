import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import type {
  BoletoResult,
  CreateBoletoParams,
  EfiBoletoProvider,
} from '@/services/cashier/efi-boleto.provider';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateBoletoForEntryUseCase } from './create-boleto-for-entry';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Fake Efi boleto provider
class FakeEfiBoletoProvider implements Pick<EfiBoletoProvider, 'createBoleto'> {
  readonly providerName = 'EFI_BOLETO_FAKE';

  async createBoleto(params: CreateBoletoParams): Promise<BoletoResult> {
    return {
      chargeId: 12345,
      barcodeNumber: '23793381286000000003280000010105100000000050000',
      digitableLine: '23793.38128 60000.000033 28000.001013 1 00000000050000',
      pdfUrl: 'https://boleto.efipay.com.br/pdf/12345',
      dueDate: params.dueDate,
      amount: params.amount,
    };
  }

  async getCharge() {
    return { status: 'waiting' };
  }
}

let entriesRepository: InMemoryFinanceEntriesRepository;
let fakeBoletoProvider: FakeEfiBoletoProvider;
let sut: CreateBoletoForEntryUseCase;

describe('CreateBoletoForEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    fakeBoletoProvider = new FakeEfiBoletoProvider();
    sut = new CreateBoletoForEntryUseCase(
      entriesRepository,
      fakeBoletoProvider as unknown as EfiBoletoProvider,
    );
  });

  it('should generate a boleto for a valid receivable entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de produto',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      customerName: 'João Silva',
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      entryId: createdEntry.id.toString(),
      tenantId: 'tenant-1',
      customerCpfCnpj: '12345678901',
    });

    expect(result.boleto.chargeId).toBe(12345);
    expect(result.boleto.barcodeNumber).toBeTruthy();
    expect(result.boleto.digitableLine).toBeTruthy();
    expect(result.boleto.pdfUrl).toBeTruthy();
    expect(result.entry.boletoChargeId).toBe(12345);
    expect(result.entry.boletoBarcodeNumber).toBeTruthy();
    expect(result.entry.boletoDigitableLine).toBeTruthy();
    expect(result.entry.boletoPdfUrl).toBeTruthy();
  });

  it('should reject boleto generation for payable entries', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pagamento fornecedor',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      supplierName: 'Fornecedor ABC',
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        customerCpfCnpj: '12345678901',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject boleto generation when customer name is missing', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Venda sem cliente',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        customerCpfCnpj: '12345678901',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject boleto generation when entry already has a boleto', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Venda com boleto existente',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      customerName: 'Maria Souza',
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
      boletoChargeId: 99999,
      boletoBarcodeNumber: '12345678901234567890123456789012345678901234',
      boletoDigitableLine:
        '12345.12345 12345.123456 12345.123456 1 12340000010000',
      boletoPdfUrl: 'https://example.com/pdf/99999',
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        customerCpfCnpj: '12345678901',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject when entry is not found', async () => {
    await expect(
      sut.execute({
        entryId: 'non-existent-id',
        tenantId: 'tenant-1',
        customerCpfCnpj: '12345678901',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should reject for PAID entry', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-004',
      description: 'Venda ja paga',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      customerName: 'Carlos Santos',
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
      status: 'RECEIVED',
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        customerCpfCnpj: '12345678901',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject invalid CPF/CNPJ', async () => {
    const createdEntry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-005',
      description: 'Venda com CPF invalido',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 500,
      customerName: 'Ana Lima',
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await expect(
      sut.execute({
        entryId: createdEntry.id.toString(),
        tenantId: 'tenant-1',
        customerCpfCnpj: '123',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
