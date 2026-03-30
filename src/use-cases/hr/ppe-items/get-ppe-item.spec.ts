import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPPEItemUseCase } from './get-ppe-item';

let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: GetPPEItemUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Get PPE Item Use Case', () => {
  beforeEach(() => {
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new GetPPEItemUseCase(ppeItemsRepository);
  });

  it('should get a PPE item by ID', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Protetor Auricular',
      category: 'EARS',
      caNumber: 'CA-98765',
    });

    const { ppeItem } = await sut.execute({
      tenantId,
      ppeItemId: created.id.toString(),
    });

    expect(ppeItem.name).toBe('Protetor Auricular');
    expect(ppeItem.category).toBe('EARS');
    expect(ppeItem.caNumber).toBe('CA-98765');
  });

  it('should throw error when PPE item is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        ppeItemId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('EPI não encontrado');
  });

  it('should not return items from different tenant', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Protetor Auricular',
      category: 'EARS',
    });

    await expect(
      sut.execute({
        tenantId: new UniqueEntityID().toString(),
        ppeItemId: created.id.toString(),
      }),
    ).rejects.toThrow('EPI não encontrado');
  });
});
