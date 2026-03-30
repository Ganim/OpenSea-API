import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetObjectiveUseCase } from './get-objective';

let objectivesRepository: InMemoryObjectivesRepository;
let sut: GetObjectiveUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Objective Use Case', () => {
  beforeEach(() => {
    objectivesRepository = new InMemoryObjectivesRepository();
    sut = new GetObjectiveUseCase(objectivesRepository);
  });

  it('should get an objective by id', async () => {
    const created = await objectivesRepository.create({
      tenantId,
      title: 'Test Objective',
      ownerId: new UniqueEntityID(),
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const { objective } = await sut.execute({
      tenantId,
      objectiveId: created.id.toString(),
    });

    expect(objective.title).toBe('Test Objective');
  });

  it('should throw if objective not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        objectiveId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Objective not found');
  });
});
