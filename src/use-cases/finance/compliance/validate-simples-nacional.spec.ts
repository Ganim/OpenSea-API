import { InMemoryCompaniesRepository } from '@/repositories/core/in-memory/in-memory-companies-repository';
import { InMemoryFinanceCategoriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-categories-repository';
import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ValidateSimplesNacionalUseCase } from './validate-simples-nacional';

let entriesRepository: InMemoryFinanceEntriesRepository;
let companiesRepository: InMemoryCompaniesRepository;
let categoriesRepository: InMemoryFinanceCategoriesRepository;
let sut: ValidateSimplesNacionalUseCase;

describe('ValidateSimplesNacionalUseCase', () => {
  beforeEach(async () => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    companiesRepository = new InMemoryCompaniesRepository();
    categoriesRepository = new InMemoryFinanceCategoriesRepository();
    sut = new ValidateSimplesNacionalUseCase(
      entriesRepository,
      companiesRepository,
    );

    // Create a category
    await categoriesRepository.create({
      tenantId: 'tenant-1',
      name: 'Servicos',
      slug: 'servicos',
      type: 'REVENUE',
    });
  });

  it('should return OK status when revenue is well below the limit', async () => {
    const categories = await categoriesRepository.findMany('tenant-1');
    const categoryId = categories[0].id.toString();

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de servico',
      categoryId,
      expectedAmount: 100000,
      actualAmount: 100000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
      status: 'RECEIVED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.status).toBe('OK');
    expect(result.annualRevenue).toBe(100000);
    expect(result.limit).toBe(4800000);
    expect(result.percentUsed).toBeLessThan(80);
    expect(result.message).toContain('dentro do limite');
  });

  it('should return WARNING when revenue exceeds 80% of the limit', async () => {
    const categories = await categoriesRepository.findMany('tenant-1');
    const categoryId = categories[0].id.toString();

    // Create entries totaling R$ 4,000,000 (83.3%)
    for (let i = 0; i < 4; i++) {
      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-${i + 1}`,
        description: `Venda ${i + 1}`,
        categoryId,
        expectedAmount: 1000000,
        actualAmount: 1000000,
        issueDate: new Date(`2026-${String(i + 1).padStart(2, '0')}-01`),
        dueDate: new Date(`2026-${String(i + 1).padStart(2, '0')}-15`),
        status: 'RECEIVED',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.status).toBe('WARNING');
    expect(result.annualRevenue).toBe(4000000);
    expect(result.percentUsed).toBeGreaterThanOrEqual(80);
    expect(result.message).toContain('aproxima do limite');
  });

  it('should return EXCEEDED when revenue exceeds the limit', async () => {
    const categories = await categoriesRepository.findMany('tenant-1');
    const categoryId = categories[0].id.toString();

    // Create entries totaling R$ 5,000,000
    for (let i = 0; i < 5; i++) {
      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'RECEIVABLE',
        code: `REC-${i + 1}`,
        description: `Venda ${i + 1}`,
        categoryId,
        expectedAmount: 1000000,
        actualAmount: 1000000,
        issueDate: new Date(`2026-${String(i + 1).padStart(2, '0')}-01`),
        dueDate: new Date(`2026-${String(i + 1).padStart(2, '0')}-15`),
        status: 'RECEIVED',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.status).toBe('EXCEEDED');
    expect(result.annualRevenue).toBe(5000000);
    expect(result.percentUsed).toBeGreaterThan(100);
    expect(result.message).toContain('excede o limite');
  });

  it('should only count PAID or RECEIVED entries', async () => {
    const categories = await categoriesRepository.findMany('tenant-1');
    const categoryId = categories[0].id.toString();

    // PENDING entry should NOT be counted
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda pendente',
      categoryId,
      expectedAmount: 5000000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
      status: 'PENDING',
    });

    // RECEIVED entry should be counted
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-002',
      description: 'Venda recebida',
      categoryId,
      expectedAmount: 100000,
      actualAmount: 100000,
      issueDate: new Date('2026-04-01'),
      dueDate: new Date('2026-04-15'),
      status: 'RECEIVED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.annualRevenue).toBe(100000);
    expect(result.status).toBe('OK');
  });

  it('should only count RECEIVABLE entries, not PAYABLE', async () => {
    const categories = await categoriesRepository.findMany('tenant-1');
    const categoryId = categories[0].id.toString();

    // PAYABLE entry should NOT be counted
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pagamento fornecedor',
      categoryId,
      expectedAmount: 5000000,
      actualAmount: 5000000,
      issueDate: new Date('2026-03-01'),
      dueDate: new Date('2026-03-15'),
      status: 'PAID',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.annualRevenue).toBe(0);
    expect(result.status).toBe('OK');
  });

  it('should return zero revenue when no entries exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.annualRevenue).toBe(0);
    expect(result.percentUsed).toBe(0);
    expect(result.status).toBe('OK');
  });

  it('should default to SIMPLES regime', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
    });

    expect(result.regime).toBe('SIMPLES');
  });
});
