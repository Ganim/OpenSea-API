import { InMemoryTaxObligationsRepository } from '@/repositories/finance/in-memory/in-memory-tax-obligations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListTaxObligationsUseCase } from './list-tax-obligations';

let taxObligationsRepository: InMemoryTaxObligationsRepository;
let sut: ListTaxObligationsUseCase;

describe('ListTaxObligationsUseCase', () => {
  beforeEach(async () => {
    taxObligationsRepository = new InMemoryTaxObligationsRepository();
    sut = new ListTaxObligationsUseCase(taxObligationsRepository);

    // Seed obligations
    await taxObligationsRepository.create({
      tenantId: 'tenant-1',
      taxType: 'IRRF',
      referenceMonth: 3,
      referenceYear: 2026,
      dueDate: new Date('2026-04-30'),
      amount: 1500,
      darfCode: '0561',
    });

    await taxObligationsRepository.create({
      tenantId: 'tenant-1',
      taxType: 'PIS',
      referenceMonth: 3,
      referenceYear: 2026,
      dueDate: new Date('2026-04-25'),
      amount: 650,
      darfCode: '8109',
    });

    await taxObligationsRepository.create({
      tenantId: 'tenant-1',
      taxType: 'INSS',
      referenceMonth: 2,
      referenceYear: 2026,
      dueDate: new Date('2026-03-20'),
      amount: 2000,
      darfCode: '2631',
    });
  });

  it('should list all obligations for a tenant', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.obligations).toHaveLength(3);
    expect(result.total).toBe(3);
  });

  it('should filter by year', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1', year: 2026 });

    expect(result.obligations).toHaveLength(3);
  });

  it('should filter by month', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      year: 2026,
      month: 3,
    });

    expect(result.obligations).toHaveLength(2);
  });

  it('should filter by tax type', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      taxType: 'IRRF',
    });

    expect(result.obligations).toHaveLength(1);
    expect(result.obligations[0].taxType).toBe('IRRF');
  });

  it('should filter by status', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      status: 'PENDING',
    });

    expect(result.obligations).toHaveLength(3);
  });

  it('should return empty for non-existent tenant', async () => {
    const result = await sut.execute({ tenantId: 'tenant-999' });

    expect(result.obligations).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should paginate results', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      limit: 2,
    });

    expect(result.obligations).toHaveLength(2);
    expect(result.total).toBe(3);
  });
});
