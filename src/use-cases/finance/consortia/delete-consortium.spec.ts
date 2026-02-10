import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryConsortiaRepository } from '@/repositories/finance/in-memory/in-memory-consortia-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteConsortiumUseCase } from './delete-consortium';

let consortiaRepository: InMemoryConsortiaRepository;
let sut: DeleteConsortiumUseCase;

let seededConsortiumId: string;

describe('DeleteConsortiumUseCase', () => {
  beforeEach(async () => {
    consortiaRepository = new InMemoryConsortiaRepository();
    sut = new DeleteConsortiumUseCase(consortiaRepository);

    const consortium = await consortiaRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-1',
      costCenterId: 'cc-1',
      name: 'Consorcio para deletar',
      administrator: 'Admin',
      creditValue: 100000,
      monthlyPayment: 1000,
      totalInstallments: 120,
      startDate: new Date('2026-01-01'),
    });
    seededConsortiumId = consortium.id.toString();
  });

  it('should soft delete a consortium', async () => {
    await sut.execute({ tenantId: 'tenant-1', id: seededConsortiumId });

    const deletedConsortium = consortiaRepository.items.find(
      (i) => i.id.toString() === seededConsortiumId,
    );
    expect(deletedConsortium?.deletedAt).toBeDefined();
  });

  it('should not delete a non-existent consortium', async () => {
    await expect(
      sut.execute({ tenantId: 'tenant-1', id: 'non-existent-id' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
