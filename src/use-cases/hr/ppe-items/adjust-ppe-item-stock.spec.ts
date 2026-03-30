import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AdjustPPEItemStockUseCase } from './adjust-ppe-item-stock';

let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: AdjustPPEItemStockUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Adjust PPE Item Stock Use Case', () => {
  beforeEach(() => {
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new AdjustPPEItemStockUseCase(ppeItemsRepository);
  });

  it('should increase stock', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 10,
    });

    const { ppeItem } = await sut.execute({
      tenantId,
      ppeItemId: created.id.toString(),
      adjustment: 5,
    });

    expect(ppeItem.currentStock).toBe(15);
  });

  it('should decrease stock', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 10,
    });

    const { ppeItem } = await sut.execute({
      tenantId,
      ppeItemId: created.id.toString(),
      adjustment: -3,
    });

    expect(ppeItem.currentStock).toBe(7);
  });

  it('should throw error when adjustment is zero', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 10,
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: created.id.toString(),
        adjustment: 0,
      }),
    ).rejects.toThrow('O ajuste de estoque não pode ser zero');
  });

  it('should throw error when adjustment would result in negative stock', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete',
      category: 'HEAD',
      currentStock: 5,
    });

    await expect(
      sut.execute({
        tenantId,
        ppeItemId: created.id.toString(),
        adjustment: -10,
      }),
    ).rejects.toThrow('O ajuste resultaria em estoque negativo');
  });

  it('should throw error when PPE item is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        ppeItemId: new UniqueEntityID().toString(),
        adjustment: 5,
      }),
    ).rejects.toThrow('EPI não encontrado');
  });
});
