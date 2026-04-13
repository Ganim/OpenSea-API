import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBomItemsRepository } from '@/repositories/production/in-memory/in-memory-bom-items-repository';
import { InMemoryBomsRepository } from '@/repositories/production/in-memory/in-memory-boms-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateBomItemUseCase } from './create-bom-item';

let bomItemsRepository: InMemoryBomItemsRepository;
let bomsRepository: InMemoryBomsRepository;
let sut: CreateBomItemUseCase;

describe('CreateBomItemUseCase', () => {
  const TENANT_ID = 'tenant-1';
  let bomId: string;

  beforeEach(async () => {
    bomItemsRepository = new InMemoryBomItemsRepository();
    bomsRepository = new InMemoryBomsRepository();
    sut = new CreateBomItemUseCase(bomItemsRepository, bomsRepository);

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

  it('should create a BOM item', async () => {
    const { bomItem } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
    });

    expect(bomItem.id.toString()).toEqual(expect.any(String));
    expect(bomItem.quantity).toBe(10);
    expect(bomItem.unit).toBe('kg');
    expect(bomItem.sequence).toBe(1);
  });

  it('should auto-sequence when not provided', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 5,
      quantity: 10,
      unit: 'kg',
    });

    const { bomItem } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-2',
      quantity: 5,
      unit: 'un',
    });

    expect(bomItem.sequence).toBe(6);
  });

  it('should auto-sequence to 1 when no items exist', async () => {
    const { bomItem } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      quantity: 10,
      unit: 'kg',
    });

    expect(bomItem.sequence).toBe(1);
  });

  it('should create item with optional fields', async () => {
    const { bomItem } = await sut.execute({
      tenantId: TENANT_ID,
      bomId,
      materialId: 'material-1',
      sequence: 1,
      quantity: 10,
      unit: 'kg',
      wastagePercent: 5,
      isOptional: true,
      notes: 'Some notes',
    });

    expect(bomItem.wastagePercent).toBe(5);
    expect(bomItem.isOptional).toBe(true);
    expect(bomItem.notes).toBe('Some notes');
  });

  it('should throw if BOM not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        bomId: 'non-existent-bom',
        materialId: 'material-1',
        quantity: 10,
        unit: 'kg',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
