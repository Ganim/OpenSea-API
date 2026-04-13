import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomItemsRepository } from '@/repositories/production/in-memory/in-memory-bom-items-repository';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomItemUseCase } from './create-bom-item';
import { DeleteBomItemUseCase } from './delete-bom-item';

let bomItemsRepository: InMemoryBomItemsRepository;
let bomsRepository: InMemoryBomsRepository;
let createBomItem: CreateBomItemUseCase;
let sut: DeleteBomItemUseCase;

describe('DeleteBomItemUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    bomItemsRepository = new InMemoryBomItemsRepository();
    bomsRepository = new InMemoryBomsRepository();
    createBomItem = new CreateBomItemUseCase(bomItemsRepository, bomsRepository);
    sut = new DeleteBomItemUseCase(bomItemsRepository);

    const bom = await bomsRepository.create({
      tenantId: TENANT_ID,
      productId: 'product-1',
      version: '1.0',
      name: 'Test BOM',
      baseQuantity: 1,
      validFrom: new Date('2026-01-01'),
      createdById: 'user-1',
    });
    bomId = bom.id.toString();
  });

  it('should delete a BOM item', async () => {
    const { bomItem } = await createBomItem.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
    });

    const result = await sut.execute({ id: bomItem.id.toString() });

    expect(result.message).toBe('BOM item deleted successfully.');
    expect(bomItemsRepository.items).toHaveLength(0);
  });

  it('should throw if BOM item not found', async () => {
    await expect(() =>
      sut.execute({ id: 'non-existent-id' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
