import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryKeyResultsRepository } from '@/repositories/hr/in-memory/in-memory-key-results-repository';
import { InMemoryOKRCheckInsRepository } from '@/repositories/hr/in-memory/in-memory-okr-check-ins-repository';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CheckInKeyResultUseCase } from './check-in-key-result';

let objectivesRepository: InMemoryObjectivesRepository;
let keyResultsRepository: InMemoryKeyResultsRepository;
let checkInsRepository: InMemoryOKRCheckInsRepository;
let sut: CheckInKeyResultUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Check-in Key Result Use Case', () => {
  beforeEach(() => {
    objectivesRepository = new InMemoryObjectivesRepository();
    keyResultsRepository = new InMemoryKeyResultsRepository();
    checkInsRepository = new InMemoryOKRCheckInsRepository();
    sut = new CheckInKeyResultUseCase(
      keyResultsRepository,
      checkInsRepository,
      objectivesRepository,
    );
  });

  it('should create a check-in and update the key result value', async () => {
    const objective = await objectivesRepository.create({
      tenantId,
      title: 'Revenue Growth',
      ownerId: new UniqueEntityID(),
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const keyResult = await keyResultsRepository.create({
      tenantId,
      objectiveId: objective.id,
      title: 'Reach 100 clients',
      type: 'NUMERIC',
      startValue: 0,
      targetValue: 100,
      weight: 1,
    });

    const { checkIn } = await sut.execute({
      tenantId,
      keyResultId: keyResult.id.toString(),
      employeeId,
      newValue: 50,
      note: 'Halfway there!',
      confidence: 'HIGH',
    });

    expect(checkIn.previousValue).toBe(0);
    expect(checkIn.newValue).toBe(50);
    expect(checkIn.confidence).toBe('HIGH');
    expect(checkInsRepository.items).toHaveLength(1);

    // Key result should be updated
    const updatedKR = keyResultsRepository.items[0];
    expect(updatedKR.currentValue).toBe(50);
  });

  it('should recalculate objective progress', async () => {
    const objective = await objectivesRepository.create({
      tenantId,
      title: 'Team Objective',
      ownerId: new UniqueEntityID(),
      level: 'TEAM',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    await keyResultsRepository.create({
      tenantId,
      objectiveId: objective.id,
      title: 'KR 1',
      type: 'PERCENTAGE',
      startValue: 0,
      targetValue: 100,
      weight: 1,
    });

    const kr2 = await keyResultsRepository.create({
      tenantId,
      objectiveId: objective.id,
      title: 'KR 2',
      type: 'NUMERIC',
      startValue: 0,
      targetValue: 200,
      weight: 1,
    });

    await sut.execute({
      tenantId,
      keyResultId: kr2.id.toString(),
      employeeId,
      newValue: 100,
      confidence: 'MEDIUM',
    });

    // KR1: 0/100 = 0%, KR2: 100/200 = 50%, average = 25%
    const updatedObjective = objectivesRepository.items[0];
    expect(updatedObjective.progress).toBe(25);
  });

  it('should throw if key result not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        keyResultId: new UniqueEntityID().toString(),
        employeeId,
        newValue: 50,
        confidence: 'LOW',
      }),
    ).rejects.toThrow('Key result not found');
  });

  it('should handle weighted progress calculation', async () => {
    const objective = await objectivesRepository.create({
      tenantId,
      title: 'Weighted Objective',
      ownerId: new UniqueEntityID(),
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    await keyResultsRepository.create({
      tenantId,
      objectiveId: objective.id,
      title: 'Heavy KR',
      type: 'NUMERIC',
      startValue: 0,
      targetValue: 100,
      currentValue: 100,
      weight: 3,
    });

    const lightKR = await keyResultsRepository.create({
      tenantId,
      objectiveId: objective.id,
      title: 'Light KR',
      type: 'NUMERIC',
      startValue: 0,
      targetValue: 100,
      weight: 1,
    });

    await sut.execute({
      tenantId,
      keyResultId: lightKR.id.toString(),
      employeeId,
      newValue: 0,
      confidence: 'LOW',
    });

    // Heavy KR: 100% * (3/4) = 75, Light KR: 0% * (1/4) = 0, total = 75
    const updatedObjective = objectivesRepository.items[0];
    expect(updatedObjective.progress).toBe(75);
  });
});
