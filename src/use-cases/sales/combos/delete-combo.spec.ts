import { InMemoryCombosRepository } from '@/repositories/sales/in-memory/in-memory-combos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateComboUseCase } from './create-combo';
import { DeleteComboUseCase } from './delete-combo';

let combosRepository: InMemoryCombosRepository;
let createCombo: CreateComboUseCase;
let sut: DeleteComboUseCase;

describe('Delete Combo Use Case', () => {
  const TENANT_ID = 'tenant-1';

  beforeEach(() => {
    combosRepository = new InMemoryCombosRepository();
    createCombo = new CreateComboUseCase(combosRepository);
    sut = new DeleteComboUseCase(combosRepository);
  });

  it('should soft delete a combo', async () => {
    const { combo: created } = await createCombo.execute({
      tenantId: TENANT_ID,
      name: 'Delete Me',
      type: 'FIXED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });

    const result = await sut.execute({
      tenantId: TENANT_ID,
      id: created.comboId.toString(),
    });

    expect(result.message).toBe('Combo deleted successfully.');

    const found = await combosRepository.findById(created.comboId, TENANT_ID);
    expect(found).toBeNull();
  });
});
