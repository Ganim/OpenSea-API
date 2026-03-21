import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCombosRepository } from '@/repositories/sales/in-memory/in-memory-combos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateComboUseCase } from './create-combo';
import { GetComboByIdUseCase } from './get-combo-by-id';

let combosRepository: InMemoryCombosRepository;
let createCombo: CreateComboUseCase;
let sut: GetComboByIdUseCase;

describe('Get Combo By Id Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    combosRepository = new InMemoryCombosRepository();
    createCombo = new CreateComboUseCase(combosRepository);
    sut = new GetComboByIdUseCase(combosRepository);
  });

  it('should get a combo by id with items', async () => {
    const items = [
      {
        id: new UniqueEntityID(),
        comboId: new UniqueEntityID(),
        productId: new UniqueEntityID('product-1'),
        quantity: 1,
        sortOrder: 0,
        createdAt: new Date(),
      },
    ];

    const { combo: created } = await createCombo.execute({
      tenantId: TENANT_ID,
      name: 'Test Combo',
      type: 'FIXED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      items,
    });

    const { combo } = await sut.execute({
      tenantId: TENANT_ID,
      id: created.comboId.toString(),
    });

    expect(combo.name).toBe('Test Combo');
    expect(combo.items).toHaveLength(1);
  });

  it('should throw if combo not found', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        id: 'non-existent-id',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
