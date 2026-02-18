import { InMemorySuppliersRepository } from '@/repositories/hr/in-memory/in-memory-suppliers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSuppliersUseCase } from './list-suppliers';

let suppliersRepository: InMemorySuppliersRepository;
let sut: ListSuppliersUseCase;

describe('List Suppliers Use Case', () => {
  beforeEach(() => {
    suppliersRepository = new InMemorySuppliersRepository();
    sut = new ListSuppliersUseCase(suppliersRepository);
  });

  it('should list suppliers', async () => {
    await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor ABC LTDA',
      cnpj: '12345678000100',
    });

    await suppliersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fornecedor XYZ LTDA',
      cnpj: '98765432000100',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 20,
    });

    expect(result.suppliers).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should return empty list when none exist', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 20,
    });

    expect(result.suppliers).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 0; i < 25; i++) {
      await suppliersRepository.create({
        tenantId: 'tenant-1',
        legalName: `Fornecedor ${i}`,
        cnpj: `${String(i).padStart(14, '0')}`,
      });
    }

    const page1 = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 10,
    });

    const page2 = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      perPage: 10,
    });

    expect(page1.suppliers).toHaveLength(10);
    expect(page2.suppliers).toHaveLength(10);
    expect(page1.total).toBe(25);
    expect(page2.total).toBe(25);
    expect(page1.suppliers[0].id.toString()).not.toBe(
      page2.suppliers[0].id.toString(),
    );
  });
});
