import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateObjectiveUseCase } from './update-objective';

let objectivesRepository: InMemoryObjectivesRepository;
let sut: UpdateObjectiveUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Update Objective Use Case', () => {
  beforeEach(() => {
    objectivesRepository = new InMemoryObjectivesRepository();
    sut = new UpdateObjectiveUseCase(objectivesRepository);
  });

  it('should update an objective', async () => {
    const created = await objectivesRepository.create({
      tenantId,
      title: 'Original',
      ownerId: new UniqueEntityID(),
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const { objective } = await sut.execute({
      tenantId,
      objectiveId: created.id.toString(),
      title: 'Updated Title',
      status: 'ACTIVE',
    });

    expect(objective.title).toBe('Updated Title');
    expect(objective.status).toBe('ACTIVE');
  });

  it('should throw if objective not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        objectiveId: new UniqueEntityID().toString(),
        title: 'Test',
      }),
    ).rejects.toThrow('Objective not found');
  });
});
