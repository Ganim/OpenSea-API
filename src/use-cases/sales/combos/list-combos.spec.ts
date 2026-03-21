import { InMemoryCombosRepository } from '@/repositories/sales/in-memory/in-memory-combos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateComboUseCase } from './create-combo';
import { ListCombosUseCase } from './list-combos';

let combosRepository: InMemoryCombosRepository;
let createCombo: CreateComboUseCase;
let sut: ListCombosUseCase;

describe('List Combos Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    combosRepository = new InMemoryCombosRepository();
    createCombo = new CreateComboUseCase(combosRepository);
    sut = new ListCombosUseCase(combosRepository);
  });

  it('should list combos', async () => {
    await createCombo.execute({
      tenantId: TENANT_ID,
      name: 'Combo A',
      type: 'FIXED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });

    await createCombo.execute({
      tenantId: TENANT_ID,
      name: 'Combo B',
      type: 'DYNAMIC',
      discountType: 'FIXED_PRICE',
      discountValue: 29.9,
    });

    const { combos } = await sut.execute({
      tenantId: TENANT_ID,
      page: 1,
      limit: 20,
    });

    expect(combos.data).toHaveLength(2);
    expect(combos.total).toBe(2);
  });
});
