import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryKeyResultsRepository } from '@/repositories/hr/in-memory/in-memory-key-results-repository';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateKeyResultUseCase } from './create-key-result';

let objectivesRepository: InMemoryObjectivesRepository;
let keyResultsRepository: InMemoryKeyResultsRepository;
let sut: CreateKeyResultUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Key Result Use Case', () => {
  beforeEach(() => {
    objectivesRepository = new InMemoryObjectivesRepository();
    keyResultsRepository = new InMemoryKeyResultsRepository();
    sut = new CreateKeyResultUseCase(
      objectivesRepository,
      keyResultsRepository,
    );
  });

  it('should create a key result for an objective', async () => {
    const objective = await objectivesRepository.create({
      tenantId,
      title: 'Revenue Growth',
      ownerId: new UniqueEntityID(),
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const { keyResult } = await sut.execute({
      tenantId,
      objectiveId: objective.id.toString(),
      title: 'Reach $1M MRR',
      type: 'CURRENCY',
      startValue: 500000,
      targetValue: 1000000,
      unit: 'USD',
      weight: 2,
    });

    expect(keyResult.title).toBe('Reach $1M MRR');
    expect(keyResult.type).toBe('CURRENCY');
    expect(keyResult.startValue).toBe(500000);
    expect(keyResult.targetValue).toBe(1000000);
    expect(keyResult.weight).toBe(2);
    expect(keyResultsRepository.items).toHaveLength(1);
  });

  it('should throw if objective not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        objectiveId: new UniqueEntityID().toString(),
        title: 'Orphan KR',
        type: 'NUMERIC',
        targetValue: 100,
      }),
    ).rejects.toThrow('Objective not found');
  });

  it('should default start value to 0 and weight to 1', async () => {
    const objective = await objectivesRepository.create({
      tenantId,
      title: 'Test Objective',
      ownerId: new UniqueEntityID(),
      level: 'TEAM',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const { keyResult } = await sut.execute({
      tenantId,
      objectiveId: objective.id.toString(),
      title: 'Simple KR',
      type: 'PERCENTAGE',
      targetValue: 100,
    });

    expect(keyResult.startValue).toBe(0);
    expect(keyResult.weight).toBe(1);
  });
});
