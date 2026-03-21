import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCatalogUseCase } from './delete-catalog';
import { InMemoryCatalogsRepository } from '@/repositories/sales/in-memory/in-memory-catalogs-repository';
import { Catalog } from '@/entities/sales/catalog';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let catalogsRepository: InMemoryCatalogsRepository;
let sut: DeleteCatalogUseCase;

describe('DeleteCatalogUseCase', () => {
  beforeEach(() => {
    catalogsRepository = new InMemoryCatalogsRepository();
    sut = new DeleteCatalogUseCase(catalogsRepository);
  });

  it('should soft-delete a catalog', async () => {
    const catalog = Catalog.create({
      tenantId: new UniqueEntityID('tenant-1'),
      name: 'Test',
      slug: 'test',
    });
    catalogsRepository.items.push(catalog);

    await sut.execute({
      catalogId: catalog.id.toString(),
      tenantId: 'tenant-1',
    });

    expect(catalogsRepository.items[0]!.isDeleted).toBe(true);
  });

  it('should throw when catalog not found', async () => {
    await expect(
      sut.execute({ catalogId: 'non-existent', tenantId: 'tenant-1' }),
    ).rejects.toThrow('Catalog not found');
  });
});
