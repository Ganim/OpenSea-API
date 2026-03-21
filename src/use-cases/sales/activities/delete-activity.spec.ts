import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteActivityUseCase } from './delete-activity';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: DeleteActivityUseCase;

const TENANT_ID = 'tenant-1';

describe('DeleteActivityUseCase', () => {
  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new DeleteActivityUseCase(activitiesRepository);
  });

  it('should soft delete an activity', async () => {
    const created = await activitiesRepository.create({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Note to delete',
      contactId: 'contact-1',
    });

    await sut.execute({
      id: created.id.toString(),
      tenantId: TENANT_ID,
    });

    // Should not be found via findById (soft deleted)
    const found = await activitiesRepository.findById(
      created.id,
      TENANT_ID,
    );
    expect(found).toBeNull();

    // But still exists in items array with deletedAt set
    const raw = activitiesRepository.items.find((i) =>
      i.id.equals(created.id),
    );
    expect(raw).toBeDefined();
    expect(raw!.deletedAt).toBeDefined();
  });

  it('should throw ResourceNotFoundError when activity does not exist', async () => {
    await expect(
      sut.execute({
        id: 'non-existent-id',
        tenantId: TENANT_ID,
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
