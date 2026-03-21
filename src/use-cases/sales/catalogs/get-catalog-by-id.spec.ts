import { describe, it, expect, beforeEach } from 'vitest';
import { GetCatalogByIdUseCase } from './get-catalog-by-id';
import { InMemoryCatalogsRepository } from '@/repositories/sales/in-memory/in-memory-catalogs-repository';
import { Catalog } from '@/entities/sales/catalog';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let catalogsRepository: InMemoryCatalogsRepository;
let sut: GetCatalogByIdUseCase;

describe('GetCatalogByIdUseCase', () => {
  beforeEach(() => {
    catalogsRepository = new InMemoryCatalogsRepository();
    sut = new GetCatalogByIdUseCase(catalogsRepository);
  });

  it('should get a catalog by id', async () => {
    const catalog = Catalog.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Test Catalog',
      slug: 'test-catalog',
    });
    catalogsRepository.items.push(catalog);

    const result = await sut.execute({
      catalogId: catalog.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(result.catalog.name).toBe('Test Catalog');
  });

  it('should throw when catalog not found', async () => {
    await expect(
      sut.execute({ catalogId: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toThrow('Catalog not found');
  });
});
