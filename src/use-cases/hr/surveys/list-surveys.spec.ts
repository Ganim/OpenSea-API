import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListSurveysUseCase } from './list-surveys';

let surveysRepository: InMemorySurveysRepository;
let sut: ListSurveysUseCase;

const tenantId = new UniqueEntityID().toString();
const createdBy = new UniqueEntityID();

describe('List Surveys Use Case', () => {
  beforeEach(async () => {
    surveysRepository = new InMemorySurveysRepository();
    sut = new ListSurveysUseCase(surveysRepository);

    await surveysRepository.create({
      tenantId,
      title: 'Engagement Survey',
      type: 'ENGAGEMENT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy,
    });

    await surveysRepository.create({
      tenantId,
      title: 'Pulse Survey',
      type: 'PULSE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy,
    });
  });

  it('should list all surveys for a tenant', async () => {
    const { surveys, total } = await sut.execute({ tenantId });

    expect(surveys).toHaveLength(2);
    expect(total).toBe(2);
  });

  it('should filter by type', async () => {
    const { surveys } = await sut.execute({ tenantId, type: 'PULSE' });

    expect(surveys).toHaveLength(1);
    expect(surveys[0].type).toBe('PULSE');
  });

  it('should paginate results', async () => {
    const { surveys, total } = await sut.execute({
      tenantId,
      page: 1,
      perPage: 1,
    });

    expect(surveys).toHaveLength(1);
    expect(total).toBe(2);
  });

  it('should filter by status', async () => {
    const { surveys } = await sut.execute({ tenantId, status: 'DRAFT' });

    expect(surveys).toHaveLength(2);
  });
});
