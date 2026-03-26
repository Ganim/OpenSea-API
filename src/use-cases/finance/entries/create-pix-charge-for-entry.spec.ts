import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryPixChargesRepository } from '@/repositories/cashier/in-memory/in-memory-pix-charges-repository';
import type { PixProvider } from '@/services/cashier/pix-provider.interface';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreatePixChargeForEntryUseCase } from './create-pix-charge-for-entry';

const mockPixProvider: PixProvider = {
  providerName: 'MOCK',
  createCharge: vi.fn().mockResolvedValue({
    txId: 'test-tx-id-123',
    location: 'https://pix.example.com/qr/test',
    pixCopiaECola: '00020126580014br.gov.bcb.pix...',
    expiresAt: new Date(Date.now() + 3600000),
  }),
  cancelCharge: vi.fn().mockResolvedValue(undefined),
  queryCharge: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
  parseWebhook: vi.fn(),
  verifyWebhook: vi.fn().mockReturnValue(true),
};

let entriesRepository: InMemoryFinanceEntriesRepository;
let pixChargesRepository: InMemoryPixChargesRepository;
let sut: CreatePixChargeForEntryUseCase;

describe('CreatePixChargeForEntryUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    pixChargesRepository = new InMemoryPixChargesRepository();
    vi.clearAllMocks();
    sut = new CreatePixChargeForEntryUseCase(
      entriesRepository,
      pixChargesRepository,
      mockPixProvider,
    );
  });

  it('should create a PIX charge for a RECEIVABLE PENDING entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de produto',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 150.50,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      customerName: 'Cliente Teste',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.txId).toBe('test-tx-id-123');
    expect(result.pixCopiaECola).toBeDefined();
    expect(result.amount).toBe(150.50);
    expect(result.entry.pixChargeId).toBeDefined();
    expect(pixChargesRepository.items).toHaveLength(1);
  });

  it('should create a PIX charge for a RECEIVABLE OVERDUE entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Venda atrasada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 200,
      issueDate: new Date('2025-01-01'),
      dueDate: new Date('2025-02-01'),
      status: 'OVERDUE',
    });

    const result = await sut.execute({
      entryId: entry.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.txId).toBe('test-tx-id-123');
    expect(result.amount).toBe(200);
  });

  it('should throw ResourceNotFoundError for non-existent entry', async () => {
    await expect(
      sut.execute({
        entryId: 'non-existent-id',
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(ResourceNotFoundError);
  });

  it('should throw BadRequestError for PAYABLE entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a pagar',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(BadRequestError);
  });

  it('should throw BadRequestError for PAID status', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-003',
      description: 'Já recebido',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
      status: 'RECEIVED',
    });

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(BadRequestError);
  });

  it('should throw BadRequestError if entry already has a pixChargeId', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-004',
      description: 'Com PIX existente',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 100,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-02-01'),
    });

    // Manually set pixChargeId
    entry.pixChargeId = 'existing-charge-id';

    await expect(
      sut.execute({
        entryId: entry.id.toString(),
        tenantId: 'tenant-1',
      }),
    ).rejects.toThrowError(BadRequestError);
  });
});
