import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryObjectivesRepository } from '@/repositories/hr/in-memory/in-memory-objectives-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListObjectivesUseCase } from './list-objectives';

let objectivesRepository: InMemoryObjectivesRepository;
let sut: ListObjectivesUseCase;

const tenantId = new UniqueEntityID().toString();
const ownerId = new UniqueEntityID();

describe('List Objectives Use Case', () => {
  beforeEach(async () => {
    objectivesRepository = new InMemoryObjectivesRepository();
    sut = new ListObjectivesUseCase(objectivesRepository);

    await objectivesRepository.create({
      tenantId,
      title: 'Company Objective',
      ownerId,
      level: 'COMPANY',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });

    await objectivesRepository.create({
      tenantId,
      title: 'Team Objective',
      ownerId,
      level: 'TEAM',
      period: 'Q2_2026',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    });
  });

  it('should list all objectives', async () => {
    const { objectives, total } = await sut.execute({ tenantId });

    expect(objectives).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter by level', async () => {
    const { objectives } = await sut.execute({ tenantId, level: 'COMPANY' });

    expect(objectives).toHaveLength(1);
    expect(objectives[0].level).toBe('COMPANY');
  });

  it('should filter by period', async () => {
    const { objectives } = await sut.execute({
      tenantId,
      period: 'Q2_2026',
    });

    expect(objectives).toHaveLength(2);
  });

  it('should paginate results', async () => {
    const { objectives, total } = await sut.execute({
      tenantId,
      page: 1,
      perPage: 1,
    });

    expect(objectives).toHaveLength(1);
    expect(total).toBe(2);
  });
});
