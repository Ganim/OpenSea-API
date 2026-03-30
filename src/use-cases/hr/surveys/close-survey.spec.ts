import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CloseSurveyUseCase } from './close-survey';

let surveysRepository: InMemorySurveysRepository;
let sut: CloseSurveyUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Close Survey Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    sut = new CloseSurveyUseCase(surveysRepository);
  });

  it('should close an active survey', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Active Survey',
      type: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const { survey } = await sut.execute({
      tenantId,
      surveyId: created.id.toString(),
    });

    expect(survey.status).toBe('CLOSED');
  });

  it('should throw if survey is not active', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Draft Survey',
      type: 'PULSE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({ tenantId, surveyId: created.id.toString() }),
    ).rejects.toThrow('Only active surveys can be closed');
  });
});
