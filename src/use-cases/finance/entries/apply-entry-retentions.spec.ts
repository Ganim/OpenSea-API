import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { InMemoryFinanceEntryRetentionsRepository } from '@/repositories/finance/in-memory/in-memory-finance-entry-retentions-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApplyEntryRetentionsUseCase } from './apply-entry-retentions';

// Mock audit queue to avoid Redis connection in tests
vi.mock('@/workers/queues/audit.queue', () => ({
  queueAuditLog: vi.fn().mockResolvedValue(undefined),
}));

let entriesRepository: InMemoryFinanceEntriesRepository;
let retentionsRepository: InMemoryFinanceEntryRetentionsRepository;
let sut: ApplyEntryRetentionsUseCase;

describe('ApplyEntryRetentionsUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    retentionsRepository = new InMemoryFinanceEntryRetentionsRepository();
    sut = new ApplyEntryRetentionsUseCase(
      entriesRepository,
      retentionsRepository,
    );
  });

  it('should throw ResourceNotFoundError when entry does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        entryId: 'non-existent-id',
        config: { applyISS: true },
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should apply ISS retention and persist records', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Serviço de TI',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyISS: true },
    });

    expect(result.retentions).toHaveLength(1);
    expect(result.retentions[0].taxType).toBe('ISS');
    expect(result.retentions[0].amount).toBe(500);
    expect(result.retentions[0].withheld).toBe(true);
    expect(result.retentions[0].entryId).toBe(entry.id.toString());
    expect(result.retentions[0].tenantId).toBe('tenant-1');
    expect(result.summary.totalRetained).toBe(500);
    expect(result.summary.netAmount).toBe(9500);
  });

  it('should apply multiple retentions and persist all with amount > 0', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Serviço completo',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: {
        applyIRRF: true,
        applyISS: true,
        applyPIS: true,
        applyCOFINS: true,
        applyCSLL: true,
      },
    });

    // All taxes should produce amount > 0 for R$ 10,000
    expect(result.retentions.length).toBeGreaterThanOrEqual(5);
    expect(result.summary.totalRetained).toBeGreaterThan(0);

    // Verify persisted in repository
    expect(retentionsRepository.items).toHaveLength(result.retentions.length);
  });

  it('should not persist retentions with zero amount (IRRF exempt)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Serviço baixo valor',
      categoryId: 'category-1',
      expectedAmount: 1000, // Below IRRF exemption (R$ 2,259.20)
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true, applyISS: true },
    });

    // IRRF is exempt (amount = 0) so should not be persisted
    // ISS: 1000 * 0.05 = 50 — should be persisted
    expect(result.retentions).toHaveLength(1);
    expect(result.retentions[0].taxType).toBe('ISS');
    expect(result.retentions[0].amount).toBe(50);
    expect(retentionsRepository.items).toHaveLength(1);
  });

  it('should replace previous retentions when re-applying', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Serviço reavaliado',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const entryId = entry.id.toString();

    // First application: ISS only
    await sut.execute({
      tenantId: 'tenant-1',
      entryId,
      config: { applyISS: true },
    });

    expect(retentionsRepository.items).toHaveLength(1);

    // Second application: ISS + CSLL (should replace, not add)
    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId,
      config: { applyISS: true, applyCSLL: true },
    });

    expect(result.retentions).toHaveLength(2);
    expect(retentionsRepository.items).toHaveLength(2);
  });

  it('should persist correct financial values with 2 decimal precision', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-005',
      description: 'Valor com decimais',
      categoryId: 'category-1',
      expectedAmount: 3333.33,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyISS: true, applyCSLL: true },
    });

    // ISS: 3333.33 * 0.05 = 166.6665 → 166.67
    const iss = result.retentions.find((r) => r.taxType === 'ISS');
    expect(iss?.amount).toBeCloseTo(166.67, 2);

    // CSLL: 3333.33 * 0.09 = 299.9997 → 300.00
    const csll = result.retentions.find((r) => r.taxType === 'CSLL');
    expect(csll?.amount).toBeCloseTo(300.0, 2);
  });

  it('should store description on each retention record', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-006',
      description: 'Teste descrição',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyISS: true },
    });

    expect(result.retentions[0].description).toContain('ISS');
  });

  it('should store grossAmount on each retention record', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-007',
      description: 'Gross amount test',
      categoryId: 'category-1',
      expectedAmount: 8000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyISS: true, applyCSLL: true },
    });

    for (const retention of result.retentions) {
      expect(retention.grossAmount).toBe(8000);
    }
  });

  it('should handle all six taxes on a large amount (R$ 1,000,000)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-008',
      description: 'Mega contrato',
      categoryId: 'category-1',
      expectedAmount: 1000000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: {
        applyIRRF: true,
        applyISS: true,
        applyINSS: true,
        applyPIS: true,
        applyCOFINS: true,
        applyCSLL: true,
      },
    });

    // IRRF amount > 0 for R$ 1,000,000
    // ISS = 50,000, INSS capped at 951.63, PIS = 6,500, COFINS = 30,000, CSLL = 90,000
    expect(result.retentions).toHaveLength(6);

    const inss = result.retentions.find((r) => r.taxType === 'INSS');
    expect(inss?.amount).toBe(951.63); // INSS ceiling

    expect(result.summary.netAmount).toBeCloseTo(
      1000000 - result.summary.totalRetained,
      2,
    );
  });

  it('should not allow cross-tenant access', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-009',
      description: 'Tenant 1 only',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        entryId: entry.id.toString(),
        config: { applyISS: true },
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);

    expect(retentionsRepository.items).toHaveLength(0);
  });
});
