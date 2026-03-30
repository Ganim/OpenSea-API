import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteObjectiveUseCase } from './delete-objective';

let objectivesRepository: InMemoryObjectivesRepository;
let sut: DeleteObjectiveUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Delete Objective Use Case', () => {
  beforeEach(() => {
    objectivesRepository = new InMemoryObjectivesRepository();
    sut = new DeleteObjectiveUseCase(objectivesRepository);
  });

  it('should delete a draft objective', async () => {
    const created = await objectivesRepository.create({
      tenantId,
      title: 'To Delete',
      ownerId: new UniqueEntityID(),
      level: 'INDIVIDUAL',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    await sut.execute({ tenantId, objectiveId: created.id.toString() });

    expect(objectivesRepository.items).toHaveLength(0);
  });

  it('should throw if objective not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        objectiveId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Objective not found');
  });

  it('should throw if objective is active', async () => {
    const created = await objectivesRepository.create({
      tenantId,
      title: 'Active Objective',
      ownerId: new UniqueEntityID(),
      level: 'COMPANY',
      status: 'ACTIVE',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    await expect(
      sut.execute({ tenantId, objectiveId: created.id.toString() }),
    ).rejects.toThrow('Cannot delete an active objective');
  });
});
