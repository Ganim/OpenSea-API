import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveyQuestionsRepository } from '@/repositories/hr/in-memory/in-memory-survey-questions-repository';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ActivateSurveyUseCase } from './activate-survey';

let surveysRepository: InMemorySurveysRepository;
let questionsRepository: InMemorySurveyQuestionsRepository;
let sut: ActivateSurveyUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Activate Survey Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    questionsRepository = new InMemorySurveyQuestionsRepository();
    sut = new ActivateSurveyUseCase(surveysRepository, questionsRepository);
  });

  it('should activate a draft survey with questions', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Test Survey',
      type: 'ENGAGEMENT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await questionsRepository.create({
      tenantId,
      surveyId: created.id,
      text: 'How satisfied are you?',
      type: 'RATING_1_5',
      order: 1,
      category: 'ENGAGEMENT',
    });

    const { survey } = await sut.execute({
      tenantId,
      surveyId: created.id.toString(),
    });

    expect(survey.status).toBe('ACTIVE');
  });

  it('should throw if survey has no questions', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Empty Survey',
      type: 'PULSE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({ tenantId, surveyId: created.id.toString() }),
    ).rejects.toThrow(
      'Survey must have at least one question before activation',
    );
  });

  it('should throw if survey is not draft', async () => {
    const created = await surveysRepository.create({
      tenantId,
      title: 'Active Survey',
      type: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({ tenantId, surveyId: created.id.toString() }),
    ).rejects.toThrow('Only draft surveys can be activated');
  });
});
