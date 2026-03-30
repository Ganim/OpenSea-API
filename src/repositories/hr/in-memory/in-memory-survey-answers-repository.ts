import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SurveyAnswer } from '@/entities/hr/survey-answer';
import type {
  CreateSurveyAnswerSchema,
  SurveyAnswersRepository,
} from '../survey-answers-repository';

export class InMemorySurveyAnswersRepository
  implements SurveyAnswersRepository
{
  public items: SurveyAnswer[] = [];

  async create(data: CreateSurveyAnswerSchema): Promise<SurveyAnswer> {
    const answer = SurveyAnswer.create({
      tenantId: new UniqueEntityID(data.tenantId),
      surveyResponseId: data.surveyResponseId,
      questionId: data.questionId,
      ratingValue: data.ratingValue,
      textValue: data.textValue,
      selectedOptions: data.selectedOptions,
    });

    this.items.push(answer);
    return answer;
  }

  async bulkCreate(
    answers: CreateSurveyAnswerSchema[],
  ): Promise<SurveyAnswer[]> {
    const createdAnswers: SurveyAnswer[] = [];
    for (const answerData of answers) {
      const answer = await this.create(answerData);
      createdAnswers.push(answer);
    }
    return createdAnswers;
  }

  async findByResponse(
    surveyResponseId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyAnswer[]> {
    return this.items.filter(
      (a) =>
        a.surveyResponseId.equals(surveyResponseId) &&
        a.tenantId.toString() === tenantId,
    );
  }

  async findByQuestion(
    questionId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyAnswer[]> {
    return this.items.filter(
      (a) =>
        a.questionId.equals(questionId) && a.tenantId.toString() === tenantId,
    );
  }
}
