import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCatalogUseCase } from './create-catalog';
import { InMemoryCatalogsRepository } from '@/repositories/sales/in-memory/in-memory-catalogs-repository';

let catalogsRepository: InMemoryCatalogsRepository;
let sut: CreateCatalogUseCase;

describe('CreateCatalogUseCase', () => {
  beforeEach(() => {
    catalogsRepository = new InMemoryCatalogsRepository();
    sut = new CreateCatalogUseCase(catalogsRepository);
  });

  it('should create a catalog', async () => {
    const { catalog } = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Summer Collection',
    });

    expect(catalog.name).toBe('Summer Collection');
    expect(catalog.slug).toBe('summer-collection');
    expect(catalog.type).toBe('GENERAL');
    expect(catalog.status).toBe('DRAFT');
    expect(catalog.layout).toBe('GRID');
    expect(catalogsRepository.items).toHaveLength(1);
  });

  it('should reject empty name', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', name: '' }),
    ).rejects.toThrow('Name is required');
  });

  it('should reject invalid type', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', name: 'Test', type: 'INVALID' }),
    ).rejects.toThrow('Invalid catalog type');
  });

  it('should reject duplicate slug within tenant', async () => {
    await sut.execute({ tenantId: 'tenant-1', name: 'Test' });

    await expect(
      sut.execute({ tenantId: 'tenant-1', name: 'Test' }),
    ).rejects.toThrow('slug already exists');
  });

  it('should allow same slug across different tenants', async () => {
    await sut.execute({ tenantId: 'tenant-1', name: 'Test' });

    const { catalog } = await sut.execute({
      tenantId: 'tenant-2',
      name: 'Test',
    });

    expect(catalog.name).toBe('Test');
  });
});
