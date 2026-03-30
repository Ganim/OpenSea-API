import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CalculateEntryRetentionsUseCase } from './calculate-entry-retentions';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: CalculateEntryRetentionsUseCase;

describe('CalculateEntryRetentionsUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new CalculateEntryRetentionsUseCase(entriesRepository);
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

  it('should calculate IRRF for entry in exempt bracket (R$ 2,000)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Serviço de consultoria',
      categoryId: 'category-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true },
    });

    expect(result.summary.retentions).toHaveLength(1);
    expect(result.summary.retentions[0].taxType).toBe('IRRF');
    expect(result.summary.retentions[0].amount).toBe(0);
    expect(result.summary.totalRetained).toBe(0);
    expect(result.summary.netAmount).toBe(2000);
  });

  it('should calculate IRRF for entry in 7.5% bracket (R$ 2,500)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Serviço de consultoria',
      categoryId: 'category-1',
      expectedAmount: 2500,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true },
    });

    // 2500 * 0.075 - 169.44 = 187.50 - 169.44 = 18.06
    expect(result.summary.retentions[0].amount).toBe(18.06);
    expect(result.summary.netAmount).toBeCloseTo(2500 - 18.06, 2);
  });

  it('should calculate IRRF for entry in 15% bracket (R$ 3,000)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Serviço técnico',
      categoryId: 'category-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true },
    });

    // 3000 * 0.15 - 381.44 = 450 - 381.44 = 68.56
    expect(result.summary.retentions[0].amount).toBe(68.56);
  });

  it('should calculate IRRF for entry in 22.5% bracket (R$ 4,000)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-004',
      description: 'Honorários',
      categoryId: 'category-1',
      expectedAmount: 4000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true },
    });

    // 4000 * 0.225 - 662.77 = 900 - 662.77 = 237.23
    expect(result.summary.retentions[0].amount).toBe(237.23);
  });

  it('should calculate IRRF for entry in 27.5% bracket (R$ 10,000)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-005',
      description: 'Consultoria premium',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true },
    });

    // 10000 * 0.275 - 896.00 = 2750 - 896 = 1854.00
    expect(result.summary.retentions[0].amount).toBe(1854.0);
  });

  it('should calculate ISS with default 5% rate', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-006',
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

    expect(result.summary.retentions[0].amount).toBe(500);
    expect(result.summary.retentions[0].rate).toBe(0.05);
    expect(result.summary.netAmount).toBe(9500);
  });

  it('should calculate ISS with custom rate (2%)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-007',
      description: 'Serviço simples',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyISS: true, issRate: 0.02 },
    });

    expect(result.summary.retentions[0].amount).toBe(200);
    expect(result.summary.retentions[0].rate).toBe(0.02);
  });

  it('should calculate INSS with progressive brackets', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-008',
      description: 'Prestador CLT',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyINSS: true },
    });

    // Progressive: 113.85 + 114.8292 + 167.634 + 113.2838 = 509.597 → 509.60
    expect(result.summary.retentions[0].amount).toBe(509.6);
    expect(result.summary.retentions[0].taxType).toBe('INSS');
  });

  it('should respect INSS ceiling for large amounts', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-009',
      description: 'Alto salário',
      categoryId: 'category-1',
      expectedAmount: 20000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyINSS: true },
    });

    expect(result.summary.retentions[0].amount).toBe(951.63);
  });

  it('should calculate PIS cumulativo (0.65%)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-010',
      description: 'Receita cumulativa',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyPIS: true, taxRegime: 'CUMULATIVO' },
    });

    expect(result.summary.retentions[0].amount).toBe(65);
    expect(result.summary.retentions[0].rate).toBe(0.0065);
  });

  it('should calculate PIS não-cumulativo (1.65%)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-011',
      description: 'Receita não-cumulativa',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyPIS: true, taxRegime: 'NAO_CUMULATIVO' },
    });

    expect(result.summary.retentions[0].amount).toBe(165);
    expect(result.summary.retentions[0].rate).toBe(0.0165);
  });

  it('should calculate COFINS cumulativo (3%)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-012',
      description: 'Receita COFINS',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyCOFINS: true, taxRegime: 'CUMULATIVO' },
    });

    expect(result.summary.retentions[0].amount).toBe(300);
    expect(result.summary.retentions[0].rate).toBe(0.03);
  });

  it('should calculate COFINS não-cumulativo (7.6%)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-013',
      description: 'Receita COFINS NC',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyCOFINS: true, taxRegime: 'NAO_CUMULATIVO' },
    });

    expect(result.summary.retentions[0].amount).toBe(760);
    expect(result.summary.retentions[0].rate).toBe(0.076);
  });

  it('should calculate CSLL at 9% flat rate', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-014',
      description: 'CSLL test',
      categoryId: 'category-1',
      expectedAmount: 10000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyCSLL: true },
    });

    expect(result.summary.retentions[0].amount).toBe(900);
    expect(result.summary.retentions[0].rate).toBe(0.09);
  });

  it('should compose multiple retentions on the same entry', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-015',
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

    expect(result.summary.retentions).toHaveLength(5);
    expect(result.summary.totalRetained).toBeGreaterThan(0);
    expect(result.summary.netAmount).toBeCloseTo(
      10000 - result.summary.totalRetained,
      2,
    );

    const taxTypes = result.summary.retentions.map((r) => r.taxType);
    expect(taxTypes).toContain('IRRF');
    expect(taxTypes).toContain('ISS');
    expect(taxTypes).toContain('PIS');
    expect(taxTypes).toContain('COFINS');
    expect(taxTypes).toContain('CSLL');
  });

  it('should return no retentions when config is empty', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-016',
      description: 'Sem retenção',
      categoryId: 'category-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: {},
    });

    expect(result.summary.retentions).toHaveLength(0);
    expect(result.summary.totalRetained).toBe(0);
    expect(result.summary.netAmount).toBe(5000);
  });

  it('should handle entry at IRRF bracket boundary (R$ 2,259.20)', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-017',
      description: 'Limite exato isenção',
      categoryId: 'category-1',
      expectedAmount: 2259.2,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: { applyIRRF: true },
    });

    expect(result.summary.retentions[0].amount).toBe(0);
    expect(result.summary.netAmount).toBe(2259.2);
  });

  it('should handle very large amount (R$ 1,000,000) with 2 decimal precision', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-018',
      description: 'Grande contrato',
      categoryId: 'category-1',
      expectedAmount: 1000000,
      issueDate: new Date('2026-01-01'),
      dueDate: new Date('2026-01-31'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      entryId: entry.id.toString(),
      config: {
        applyISS: true,
        applyCSLL: true,
        applyPIS: true,
        applyCOFINS: true,
      },
    });

    // ISS: 1,000,000 * 0.05 = 50,000
    const iss = result.summary.retentions.find((r) => r.taxType === 'ISS');
    expect(iss?.amount).toBe(50000);

    // CSLL: 1,000,000 * 0.09 = 90,000
    const csll = result.summary.retentions.find((r) => r.taxType === 'CSLL');
    expect(csll?.amount).toBe(90000);

    // PIS cumulativo: 1,000,000 * 0.0065 = 6,500
    const pis = result.summary.retentions.find((r) => r.taxType === 'PIS');
    expect(pis?.amount).toBe(6500);

    // COFINS cumulativo: 1,000,000 * 0.03 = 30,000
    const cofins = result.summary.retentions.find(
      (r) => r.taxType === 'COFINS',
    );
    expect(cofins?.amount).toBe(30000);

    // Verify 2 decimal precision on net amount
    const netStr = result.summary.netAmount.toString();
    const decimalPart = netStr.split('.')[1];
    expect(!decimalPart || decimalPart.length <= 2).toBe(true);
  });

  it('should not allow cross-tenant access', async () => {
    const entry = await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-019',
      description: 'Tenant 1 entry',
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
  });
});
