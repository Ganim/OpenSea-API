import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateObjectiveUseCase } from './create-objective';

let objectivesRepository: InMemoryObjectivesRepository;
let sut: CreateObjectiveUseCase;

const tenantId = new UniqueEntityID().toString();
const ownerId = new UniqueEntityID().toString();

describe('Create Objective Use Case', () => {
  beforeEach(() => {
    objectivesRepository = new InMemoryObjectivesRepository();
    sut = new CreateObjectiveUseCase(objectivesRepository);
  });

  it('should create an objective', async () => {
    const { objective } = await sut.execute({
      tenantId,
      title: 'Increase Revenue by 20%',
      description: 'Company-wide revenue target',
      ownerId,
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    expect(objective.title).toBe('Increase Revenue by 20%');
    expect(objective.level).toBe('COMPANY');
    expect(objective.status).toBe('DRAFT');
    expect(objective.progress).toBe(0);
    expect(objectivesRepository.items).toHaveLength(1);
  });

  it('should create a child objective', async () => {
    const parent = await objectivesRepository.create({
      tenantId,
      title: 'Parent Objective',
      ownerId: new UniqueEntityID(ownerId),
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    const { objective } = await sut.execute({
      tenantId,
      title: 'Child Objective',
      ownerId,
      parentId: parent.id.toString(),
      level: 'DEPARTMENT',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    expect(objective.parentId?.toString()).toBe(parent.id.toString());
  });

  it('should throw if parent objective not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Orphan Objective',
        ownerId,
        parentId: new UniqueEntityID().toString(),
        level: 'TEAM',
        period: 'Q2_2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-06-30'),
      }),
    ).rejects.toThrow('Parent objective not found');
  });

  it('should throw if end date is before start date', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Invalid Objective',
        ownerId,
        level: 'INDIVIDUAL',
        period: 'Q2_2026',
        startDate: new Date('2026-06-30'),
        endDate: new Date('2026-04-01'),
      }),
    ).rejects.toThrow('End date must be after start date');
  });
});
