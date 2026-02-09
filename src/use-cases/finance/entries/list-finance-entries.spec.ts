import { InMemoryFinanceEntriesRepository } from '@/repositories/finance/in-memory/in-memory-finance-entries-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListFinanceEntriesUseCase } from './list-finance-entries';

let entriesRepository: InMemoryFinanceEntriesRepository;
let sut: ListFinanceEntriesUseCase;

describe('ListFinanceEntriesUseCase', () => {
  beforeEach(() => {
    entriesRepository = new InMemoryFinanceEntriesRepository();
    sut = new ListFinanceEntriesUseCase(entriesRepository);
  });

  it('should list finance entries', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Venda de servico',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 12000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.entries).toHaveLength(2);
    expect(result.meta.total).toBe(2);
  });

  it('should filter by type', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Conta a pagar',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 3000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'RECEIVABLE',
      code: 'REC-001',
      description: 'Conta a receber',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 8000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-03-01'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Outra conta a pagar',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1500,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-15'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
    });

    expect(result.entries).toHaveLength(2);
    expect(result.meta.total).toBe(2);
    expect(result.entries.every((e) => e.type === 'PAYABLE')).toBe(true);
  });

  it('should filter by status', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Pendente',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 1000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
      status: 'PENDING',
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Cancelada',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 2000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
      status: 'CANCELLED',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'PENDING',
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].status).toBe('PENDING');
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 25; i++) {
      await entriesRepository.create({
        tenantId: 'tenant-1',
        type: 'PAYABLE',
        code: `PAG-${String(i).padStart(3, '0')}`,
        description: `Conta numero ${i}`,
        categoryId: 'category-1',
        costCenterId: 'cost-center-1',
        expectedAmount: i * 100,
        issueDate: new Date('2026-02-01'),
        dueDate: new Date('2026-02-28'),
      });
    }

    const firstPage = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 10,
    });

    expect(firstPage.entries).toHaveLength(10);
    expect(firstPage.meta.total).toBe(25);

    const secondPage = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 10,
    });

    expect(secondPage.entries).toHaveLength(10);
    expect(secondPage.meta.total).toBe(25);

    const thirdPage = await sut.execute({
      tenantId: 'tenant-1',
      page: 3,
      limit: 10,
    });

    expect(thirdPage.entries).toHaveLength(5);
    expect(thirdPage.meta.total).toBe(25);
  });

  it('should return empty list', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
    });

    expect(result.entries).toHaveLength(0);
    expect(result.meta.total).toBe(0);
  });

  it('should search by description', async () => {
    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-001',
      description: 'Aluguel do escritorio central',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 5000,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-002',
      description: 'Conta de energia eletrica',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 800,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    await entriesRepository.create({
      tenantId: 'tenant-1',
      type: 'PAYABLE',
      code: 'PAG-003',
      description: 'Servico de internet',
      categoryId: 'category-1',
      costCenterId: 'cost-center-1',
      expectedAmount: 300,
      issueDate: new Date('2026-02-01'),
      dueDate: new Date('2026-02-28'),
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      search: 'aluguel',
    });

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].description).toBe('Aluguel do escritorio central');
  });
});
