import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemorySurveyQuestionsRepository } from '@/repositories/hr/in-memory/in-memory-survey-questions-repository';
import { InMemorySurveysRepository } from '@/repositories/hr/in-memory/in-memory-surveys-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateSurveyQuestionUseCase } from './create-survey-question';

let surveysRepository: InMemorySurveysRepository;
let questionsRepository: InMemorySurveyQuestionsRepository;
let sut: CreateSurveyQuestionUseCase;

const tenantId = new UniqueEntityID().toString();

describe('Create Survey Question Use Case', () => {
  beforeEach(() => {
    surveysRepository = new InMemorySurveysRepository();
    questionsRepository = new InMemorySurveyQuestionsRepository();
    sut = new CreateSurveyQuestionUseCase(
      surveysRepository,
      questionsRepository,
    );
  });

  it('should create a question for a draft survey', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'Test Survey',
      type: 'ENGAGEMENT',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const { question } = await sut.execute({
      tenantId,
      surveyId: survey.id.toString(),
      text: 'How do you rate your experience?',
      type: 'RATING_1_5',
      order: 1,
      category: 'ENGAGEMENT',
    });

    expect(question.text).toBe('How do you rate your experience?');
    expect(question.type).toBe('RATING_1_5');
    expect(questionsRepository.items).toHaveLength(1);
  });

  it('should throw if survey not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        surveyId: new UniqueEntityID().toString(),
        text: 'Test?',
        type: 'TEXT',
        order: 1,
        category: 'CUSTOM',
      }),
    ).rejects.toThrow('Survey not found');
  });

  it('should throw if survey is not draft', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'Active Survey',
      type: 'PULSE',
      status: 'ACTIVE',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    await expect(
      sut.execute({
        tenantId,
        surveyId: survey.id.toString(),
        text: 'Question?',
        type: 'YES_NO',
        order: 1,
        category: 'CULTURE',
      }),
    ).rejects.toThrow('Questions can only be added to draft surveys');
  });

  it('should create a multiple choice question with options', async () => {
    const survey = await surveysRepository.create({
      tenantId,
      title: 'MC Survey',
      type: 'CUSTOM',
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000),
      createdBy: new UniqueEntityID(),
    });

    const { question } = await sut.execute({
      tenantId,
      surveyId: survey.id.toString(),
      text: 'Pick one',
      type: 'MULTIPLE_CHOICE',
      options: ['Option A', 'Option B', 'Option C'],
      order: 1,
      category: 'CUSTOM',
    });

    expect(question.options).toEqual(['Option A', 'Option B', 'Option C']);
  });
});
