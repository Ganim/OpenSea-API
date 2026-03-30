import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SurveyAnswer } from '@/entities/hr/survey-answer';
import { prisma } from '@/lib/prisma';
import { mapSurveyAnswerPrismaToDomain } from '@/mappers/hr/survey-answer';
import type {
  CreateSurveyAnswerSchema,
  SurveyAnswersRepository,
} from '../survey-answers-repository';

export class PrismaSurveyAnswersRepository implements SurveyAnswersRepository {
  async create(data: CreateSurveyAnswerSchema): Promise<SurveyAnswer> {
    const answerData = await prisma.surveyAnswer.create({
      data: {
        tenantId: data.tenantId,
        surveyResponseId: data.surveyResponseId.toString(),
        questionId: data.questionId.toString(),
        ratingValue: data.ratingValue,
        textValue: data.textValue,
        selectedOptions: data.selectedOptions ?? undefined,
      },
    });

    return SurveyAnswer.create(
      mapSurveyAnswerPrismaToDomain(answerData),
      new UniqueEntityID(answerData.id),
    );
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
    const answersData = await prisma.surveyAnswer.findMany({
      where: {
        surveyResponseId: surveyResponseId.toString(),
        tenantId,
      },
    });

    return answersData.map((a) =>
      SurveyAnswer.create(
        mapSurveyAnswerPrismaToDomain(a),
        new UniqueEntityID(a.id),
      ),
    );
  }

  async findByQuestion(
    questionId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyAnswer[]> {
    const answersData = await prisma.surveyAnswer.findMany({
      where: {
        questionId: questionId.toString(),
        tenantId,
      },
    });

    return answersData.map((a) =>
      SurveyAnswer.create(
        mapSurveyAnswerPrismaToDomain(a),
        new UniqueEntityID(a.id),
      ),
    );
  }
}
