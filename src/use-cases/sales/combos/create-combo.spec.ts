import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCombosRepository } from '@/repositories/sales/in-memory/in-memory-combos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateComboUseCase } from './create-combo';

let combosRepository: InMemoryCombosRepository;
let sut: CreateComboUseCase;

describe('Create Combo Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    combosRepository = new InMemoryCombosRepository();
    sut = new CreateComboUseCase(combosRepository);
  });

  it('should create a FIXED combo with items', async () => {
    const items = [
      {
        id: new UniqueEntityID(),
        comboId: new UniqueEntityID(),
        productId: new UniqueEntityID('product-1'),
        quantity: 1,
        sortOrder: 0,
        createdAt: new Date(),
      },
      {
        id: new UniqueEntityID(),
        comboId: new UniqueEntityID(),
        productId: new UniqueEntityID('product-2'),
        quantity: 2,
        sortOrder: 1,
        createdAt: new Date(),
      },
    ];

    const { combo } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Burger Combo',
      description: 'Burger + Fries + Drink',
      type: 'FIXED',
      discountType: 'PERCENTAGE',
      discountValue: 15,
      items,
    });

    expect(combo.comboId.toString()).toEqual(expect.any(String));
    expect(combo.name).toBe('Burger Combo');
    expect(combo.type).toBe('FIXED');
    expect(combo.items).toHaveLength(2);
  });

  it('should create a DYNAMIC combo with categories', async () => {
    const { combo } = await sut.execute({
      tenantId: TENANT_ID,
      name: 'Build Your Own',
      type: 'DYNAMIC',
      discountType: 'FIXED_PRICE',
      discountValue: 29.9,
      categoryIds: ['cat-entrees', 'cat-sides', 'cat-drinks'],
      minItems: 3,
      maxItems: 5,
    });

    expect(combo.type).toBe('DYNAMIC');
    expect(combo.categoryIds).toHaveLength(3);
    expect(combo.minItems).toBe(3);
    expect(combo.maxItems).toBe(5);
  });

  it('should not create a combo with empty name', async () => {
    await expect(() =>
      sut.execute({
        tenantId: TENANT_ID,
        name: '',
        type: 'FIXED',
        discountType: 'PERCENTAGE',
        discountValue: 10,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });
});
