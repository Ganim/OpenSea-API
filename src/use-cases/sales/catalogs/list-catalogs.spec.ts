import { describe, it, expect, beforeEach } from 'vitest';
import { ListCatalogsUseCase } from './list-catalogs';
import { InMemoryCatalogsRepository } from '@/repositories/sales/in-memory/in-memory-catalogs-repository';
import { Catalog } from '@/entities/sales/catalog';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

let catalogsRepository: InMemoryCatalogsRepository;
let sut: ListCatalogsUseCase;

describe('ListCatalogsUseCase', () => {
  beforeEach(() => {
    catalogsRepository = new InMemoryCatalogsRepository();
    sut = new ListCatalogsUseCase(catalogsRepository);
  });

  it('should list catalogs for a tenant', async () => {
    const tenantId = new UniqueEntityID('tenant-1');

    catalogsRepository.items.push(
      Catalog.create({ tenantId, name: 'Catalog 1', slug: 'catalog-1' }),
      Catalog.create({ tenantId, name: 'Catalog 2', slug: 'catalog-2' }),
    );

    const { catalogs } = await sut.execute({ tenantId: 'tenant-1' });

    expect(catalogs.data).toHaveLength(2);
    expect(catalogs.total).toBe(2);
  });

  it('should paginate results', async () => {
    const tenantId = new UniqueEntityID('tenant-1');

    for (let i = 0; i < 25; i++) {
      catalogsRepository.items.push(
        Catalog.create({ tenantId, name: `Catalog ${i}`, slug: `catalog-${i}` }),
      );
    }

    const { catalogs } = await sut.execute({
      tenantId: 'tenant-1',
      page: 2,
      limit: 10,
    });

    expect(catalogs.data).toHaveLength(10);
    expect(catalogs.totalPages).toBe(3);
  });

  it('should filter by status', async () => {
    const tenantId = new UniqueEntityID('tenant-1');
    const catalog = Catalog.create({ tenantId, name: 'Active', slug: 'active' });
    catalog.activate();
    catalogsRepository.items.push(catalog);
    catalogsRepository.items.push(
      Catalog.create({ tenantId, name: 'Draft', slug: 'draft' }),
    );

    const { catalogs } = await sut.execute({
      tenantId: 'tenant-1',
      status: 'ACTIVE',
    });

    expect(catalogs.data).toHaveLength(1);
    expect(catalogs.data[0]!.name).toBe('Active');
  });
});
