import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSurveyUseCase } from './get-survey';

let surveysRepository: InMemorySurveysRepository;
let sut: GetSurveyUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Get Survey Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    sut = new GetSurveyUseCase(surveysRepository);
  });

  it('should get a survey by id', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Test Survey',
      type: 'ENGAGEMENT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const { survey } = await sut.execute({
      tenantId,
      surveyId: created.id.toString(),
    });

    expect(survey.title).toBe('Test Survey');
  });

  it('should throw if survey not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        surveyId: new UniqueEntityID().toString(),
      }),
    ).rejects.toThrow('Survey not found');
  });
});
