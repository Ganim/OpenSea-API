import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCatalogUseCase } from './update-catalog';
import { InMemoryCatalogsRepository } from '@/repositories/sales/in-memory/in-memory-catalogs-repository';
import { Catalog } from '@/entities/sales/catalog';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let catalogsRepository: InMemoryCatalogsRepository;
let sut: UpdateCatalogUseCase;

describe('UpdateCatalogUseCase', () => {
  beforeEach(() => {
    catalogsRepository = new InMemoryCatalogsRepository();
    sut = new UpdateCatalogUseCase(catalogsRepository);
  });

  it('should update a catalog', async () => {
    const catalog = Catalog.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Old Name',
      slug: 'old-name',
    });
    catalogsRepository.items.push(catalog);

    const result = await sut.execute({
      catalogId: catalog.id.toString(),
      tenantId: 'tenant-1',
      name: 'New Name',
      isPublic: true,
    });

    expect(result.catalog.name).toBe('New Name');
    expect(result.catalog.isPublic).toBe(true);
  });

  it('should throw when catalog not found', async () => {
    await expect(
      sut.execute({
        catalogId: 'non-existent',
        tenantId: 'tenant-1',
        name: 'Test',
      }),
    ).rejects.toThrow('Catalog not found');
  });
});
