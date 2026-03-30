import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListPPEItemsUseCase } from './list-ppe-items';

let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: ListPPEItemsUseCase;
const tenantId = new UniqueEntityID().toString();

describe('List PPE Items Use Case', () => {
  beforeEach(async () => {
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new ListPPEItemsUseCase(ppeItemsRepository);

    // Seed test data
    await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete de Segurança',
      category: 'HEAD',
      minStock: 10,
      currentStock: 5,
      isActive: true,
    });

    await ppeItemsRepository.create({
      tenantId,
      name: 'Luva de Proteção',
      category: 'HANDS',
      minStock: 20,
      currentStock: 50,
      isActive: true,
    });

    await ppeItemsRepository.create({
      tenantId,
      name: 'Óculos de Proteção (Descontinuado)',
      category: 'EYES',
      minStock: 0,
      currentStock: 0,
      isActive: false,
    });
  });

  it('should list all PPE items for a tenant', async () => {
    const { ppeItems, total } = await sut.execute({ tenantId });

    expect(ppeItems).toHaveLength(3);
    expect(total).toBe(3);
  });

  it('should filter by category', async () => {
    const { ppeItems, total } = await sut.execute({
      tenantId,
      category: 'HEAD',
    });

    expect(ppeItems).toHaveLength(1);
    expect(total).toBe(1);
    expect(ppeItems[0].category).toBe('HEAD');
  });

  it('should filter by active status', async () => {
    const { ppeItems, total } = await sut.execute({
      tenantId,
      isActive: true,
    });

    expect(ppeItems).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter low stock items only', async () => {
    const { ppeItems, total } = await sut.execute({
      tenantId,
      lowStockOnly: true,
    });

    // Capacete (5 <= 10) and Óculos (0 <= 0) are low stock
    expect(total).toBe(2);
    ppeItems.forEach((item) => {
      expect(item.isLowStock()).toBe(true);
    });
  });

  it('should filter by search term', async () => {
    const { ppeItems, total } = await sut.execute({
      tenantId,
      search: 'Capacete',
    });

    expect(ppeItems).toHaveLength(1);
    expect(total).toBe(1);
    expect(ppeItems[0].name).toBe('Capacete de Segurança');
  });

  it('should paginate results', async () => {
    const { ppeItems, total } = await sut.execute({
      tenantId,
      page: 1,
      perPage: 2,
    });

    expect(ppeItems).toHaveLength(2);
    expect(total).toBe(3);
  });

  it('should return empty for different tenant', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const { ppeItems, total } = await sut.execute({
      tenantId: otherTenantId,
    });

    expect(ppeItems).toHaveLength(0);
    expect(total).toBe(0);
  });
});
