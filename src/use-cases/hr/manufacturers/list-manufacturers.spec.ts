import { InMemoryManufacturersRepository } from '@/repositories/hr/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListManufacturersUseCase } from './list-manufacturers';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: ListManufacturersUseCase;

describe('ListManufacturersUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new ListManufacturersUseCase(manufacturersRepository);
  });

  it('should list manufacturers', async () => {
    await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante A',
      cnpj: '11111111000111',
    });

    await manufacturersRepository.create({
      tenantId: 'tenant-1',
      legalName: 'Fabricante B',
      cnpj: '22222222000122',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.manufacturers).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.manufacturers[0].legalName).toBe('Fabricante A');
    expect(result.manufacturers[1].legalName).toBe('Fabricante B');
  });

  it('should return empty list when none exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.manufacturers).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should paginate results', async () => {
    for (let i = 1; i <= 25; i++) {
      await manufacturersRepository.create({
        tenantId: 'tenant-1',
        legalName: `Fabricante ${String(i).padStart(2, '0')}`,
        cnpj: `${String(i).padStart(14, '0')}`,
      });
    }

    const page1 = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 10,
    });
    expect(page1.manufacturers).toHaveLength(10);
    expect(page1.total).toBe(25);

    const page2 = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      perPage: 10,
    });
    expect(page2.manufacturers).toHaveLength(10);
    expect(page2.total).toBe(25);

    const page3 = await sut.execute({
      tenantId: 'tenant-1',
      page: 3,
      perPage: 10,
    });
    expect(page3.manufacturers).toHaveLength(5);
    expect(page3.total).toBe(25);
  });
});
