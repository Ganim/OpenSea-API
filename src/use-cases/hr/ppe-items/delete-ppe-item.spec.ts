import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPPEItemsRepository } from '@/repositories/hr/in-memory/in-memory-ppe-items-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeletePPEItemUseCase } from './delete-ppe-item';

let ppeItemsRepository: InMemoryPPEItemsRepository;
let sut: DeletePPEItemUseCase;
const tenantId = new UniqueEntityID().toString();

describe('Delete PPE Item Use Case', () => {
  beforeEach(() => {
    ppeItemsRepository = new InMemoryPPEItemsRepository();
    sut = new DeletePPEItemUseCase(ppeItemsRepository);
  });

  it('should soft-delete a PPE item', async () => {
    const created = await ppeItemsRepository.create({
      tenantId,
      name: 'Capacete para Exclusão',
      category: 'HEAD',
    });

    await sut.execute({
      tenantId,
      ppeItemId: created.id.toString(),
    });

    // Should no longer be found
    const found = await ppeItemsRepository.findById(created.id, tenantId);
    expect(found).toBeNull();
  });

  it('should throw error when PPE item is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        ppeItemId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('EPI não encontrado');
  });
});
