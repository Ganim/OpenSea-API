import { InMemoryBomItemsRepository } from '@/repositories/production/in-memory/in-memory-bom-items-repository';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomItemUseCase } from './create-bom-item';
import { ListBomItemsUseCase } from './list-bom-items';

let bomItemsRepository: InMemoryBomItemsRepository;
let bomsRepository: InMemoryBomsRepository;
let createBomItem: CreateBomItemUseCase;
let sut: ListBomItemsUseCase;

describe('ListBomItemsUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    bomItemsRepository = new InMemoryBomItemsRepository();
    bomsRepository = new InMemoryBomsRepository();
    createBomItem = new CreateBomItemUseCase(bomItemsRepository, bomsRepository);
    sut = new ListBomItemsUseCase(bomItemsRepository);

    const bom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: 1,
      name: 'Test BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });
    bomId = bom.id.toString();
  });

  it('should list items by bomId', async () => {
    await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
    });

    await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-2',
      sequence: 2,
      quantity: 5,
      unit: 'un',
    });

    const { bomItems } = await sut.execute({ bomId });

    expect(bomItems).toHaveLength(2);
  });

  it('should return empty array when no items exist', async () => {
    const { bomItems } = await sut.execute({ bomId });

    expect(bomItems).toHaveLength(0);
  });

  it('should not return items from other BOMs', async () => {
    const otherBom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-2',
      version: 1,
      name: 'Other BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });

    await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
    });

    await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId: otherBom.id.toString(),
      materialId: 'material-2',
      sequence: 1,
      quantity: 5,
      unit: 'un',
    });

    const { bomItems } = await sut.execute({ bomId });

    expect(bomItems).toHaveLength(1);
  });
});
