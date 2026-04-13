import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomItemsRepository } from '@/repositories/production/in-memory/in-memory-bom-items-repository';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomItemUseCase } from './create-bom-item';
import { UpdateBomItemUseCase } from './update-bom-item';

let bomItemsRepository: InMemoryBomItemsRepository;
let bomsRepository: InMemoryBomsRepository;
let createBomItem: CreateBomItemUseCase;
let sut: UpdateBomItemUseCase;

describe('UpdateBomItemUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    bomItemsRepository = new InMemoryBomItemsRepository();
    bomsRepository = new InMemoryBomsRepository();
    createBomItem = new CreateBomItemUseCase(bomItemsRepository, bomsRepository);
    sut = new UpdateBomItemUseCase(bomItemsRepository);

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

  it('should update a BOM item', async () => {
    const { bomItem: created } = await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
    });

    const { bomItem } = await sut.execute({
      id: created.id.toString(),
      quantity: 20,
      unit: 'g',
    });

    expect(bomItem.quantity).toBe(20);
    expect(bomItem.unit).toBe('g');
  });

  it('should update notes to null', async () => {
    const { bomItem: created } = await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
      notes: 'Some notes',
    });

    const { bomItem } = await sut.execute({
      id: created.id.toString(),
      notes: null,
    });

    expect(bomItem.notes).toBeNull();
  });

  it('should throw if BOM item not found', async () => {
    await expect(() =>
      sut.execute({
        id: 'non-existent-id',
        quantity: 5,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
