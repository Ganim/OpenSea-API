import { InMemoryCombosRepository } from '@/repositories/sales/in-memory/in-memory-combos-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateComboUseCase } from './update-combo';

let combosRepository: InMemoryCombosRepository;
let sut: UpdateComboUseCase;

describe('UpdateComboUseCase', () => {
  beforeEach(() => {
    combosRepository = new InMemoryCombosRepository();
    sut = new UpdateComboUseCase(combosRepository);
  });

  it('should update combo fields', async () => {
    const combo = await combosRepository.create({
      tenantId: 'tenant-1',
      name: 'Old Combo',
      type: 'FIXED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      id: combo.id.toString(),
      name: 'Updated Combo',
      isActive: false,
    });

    expect(result.combo.name).toBe('Updated Combo');
    expect(result.combo.isActive).toBe(false);
  });

  it('should throw if combo is not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        id: 'non-existent',
        name: 'Test',
      }),
    ).rejects.toThrow('Combo not found.');
  });

  it('should throw if combo belongs to another tenant', async () => {
    const combo = await combosRepository.create({
      tenantId: 'tenant-1',
      name: 'Combo',
      type: 'FIXED',
      discountType: 'PERCENTAGE',
      discountValue: 10,
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-2',
        id: combo.id.toString(),
        name: 'Test',
      }),
    ).rejects.toThrow('Combo not found.');
  });
});
