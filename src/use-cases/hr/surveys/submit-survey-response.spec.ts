import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveyAnswersRepository } from '@/repositories/hr/in-memory/in-memory-survey-answers-repository';
import { InMemorySurveyResponsesRepository } from '@/repositories/hr/in-memory/in-memory-survey-responses-repository';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SubmitSurveyResponseUseCase } from './submit-survey-response';

let surveysRepository: InMemorySurveysRepository;
let responsesRepository: InMemorySurveyResponsesRepository;
let answersRepository: InMemorySurveyAnswersRepository;
let sut: SubmitSurveyResponseUseCase;

const tenantId = new UniqueEntityID().toString();
const employeeId = new UniqueEntityID().toString();

describe('Submit Survey Response Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    responsesRepository = new InMemorySurveyResponsesRepository();
    answersRepository = new InMemorySurveyAnswersRepository();
    sut = new SubmitSurveyResponseUseCase(
      surveysRepository,
      responsesRepository,
      answersRepository,
    );
  });

  it('should submit a response to an active survey', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'Active Survey',
      type: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const questionId = new UniqueEntityID().toString();

    const { surveyResponse } = await sut.execute({
      tenantId,
      surveyId: survey.id.toString(),
      employeeId,
      answers: [{ questionId, ratingValue: 4 }],
    });

    expect(surveyResponse.surveyId.toString()).toBe(survey.id.toString());
    expect(responsesRepository.items).toHaveLength(1);
    expect(answersRepository.items).toHaveLength(1);
  });

  it('should throw if survey is not active', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'Draft Survey',
      type: 'PULSE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({
        tenantId,
        surveyId: survey.id.toString(),
        employeeId,
        answers: [],
      }),
    ).rejects.toThrow('Survey is not active');
  });

  it('should prevent duplicate submissions for non-anonymous surveys', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'Non-anonymous Survey',
      type: 'SATISFACTION',
      status: 'ACTIVE',
      isAnonymous: false,
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await sut.execute({
      tenantId,
      surveyId: survey.id.toString(),
      employeeId,
      answers: [],
    });

    await expect(
      sut.execute({
        tenantId,
        surveyId: survey.id.toString(),
        employeeId,
        answers: [],
      }),
    ).rejects.toThrow('Employee has already submitted a response');
  });

  it('should submit multiple answers', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'Multi Q Survey',
      type: 'ENGAGEMENT',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const q1 = new UniqueEntityID().toString();
    const q2 = new UniqueEntityID().toString();

    await sut.execute({
      tenantId,
      surveyId: survey.id.toString(),
      employeeId,
      answers: [
        { questionId: q1, ratingValue: 5 },
        { questionId: q2, textValue: 'Great workplace' },
      ],
    });

    expect(answersRepository.items).toHaveLength(2);
  });
});
