import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from './create-manufacturer';
import { ListManufacturersUseCase } from './list-manufacturers';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: ListManufacturersUseCase;
let createManufacturer: CreateManufacturerUseCase;

describe('ListManufacturersUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new ListManufacturersUseCase(manufacturersRepository);
    createManufacturer = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should list all manufacturers', async () => {
    await createManufacturer.execute({
      tenantId: 'tenant-1',
      name: 'TechCorp',
      country: 'United States',
    });

    await createManufacturer.execute({
      tenantId: 'tenant-1',
      name: 'Manufacturing Ltd',
      country: 'Brazil',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.manufacturers).toHaveLength(2);
    expect(result.manufacturers[0].name).toBe('TechCorp');
    expect(result.manufacturers[1].name).toBe('Manufacturing Ltd');
  });

  it('should return empty array when no manufacturers exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.manufacturers).toHaveLength(0);
  });
});
