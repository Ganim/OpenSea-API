import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SurveyQuestion } from '@/entities/hr/survey-question';
import { prisma } from '@/lib/prisma';
import { mapSurveyQuestionPrismaToDomain } from '@/mappers/hr/survey-question';
import type {
  CreateSurveyQuestionSchema,
  SurveyQuestionsRepository,
  UpdateSurveyQuestionSchema,
} from '../survey-questions-repository';

export class PrismaSurveyQuestionsRepository
  implements SurveyQuestionsRepository
{
  async create(data: CreateSurveyQuestionSchema): Promise<SurveyQuestion> {
    const questionData = await prisma.surveyQuestion.create({
      data: {
        tenantId: data.tenantId,
        surveyId: data.surveyId.toString(),
        text: data.text,
        type: data.type,
        options: data.options ?? undefined,
        order: data.order,
        isRequired: data.isRequired ?? true,
        category: data.category,
      },
    });

    return SurveyQuestion.create(
      mapSurveyQuestionPrismaToDomain(questionData),
      new UniqueEntityID(questionData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyQuestion | null> {
    const questionData = await prisma.surveyQuestion.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!questionData) return null;

    return SurveyQuestion.create(
      mapSurveyQuestionPrismaToDomain(questionData),
      new UniqueEntityID(questionData.id),
    );
  }

  async findBySurvey(
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyQuestion[]> {
    const questionsData = await prisma.surveyQuestion.findMany({
      where: { surveyId: surveyId.toString(), tenantId },
      orderBy: { order: 'asc' },
    });

    return questionsData.map((q) =>
      SurveyQuestion.create(
        mapSurveyQuestionPrismaToDomain(q),
        new UniqueEntityID(q.id),
      ),
    );
  }

  async update(
    data: UpdateSurveyQuestionSchema,
  ): Promise<SurveyQuestion | null> {
    const existing = await prisma.surveyQuestion.findUnique({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
    });

    if (!existing) return null;

    const questionData = await prisma.surveyQuestion.update({
      where: { id: data.id.toString(), ...(data.tenantId && { tenantId: data.tenantId }), },
      data: {
        text: data.text,
        type: data.type,
        options: data.options ?? undefined,
        order: data.order,
        isRequired: data.isRequired,
        category: data.category,
      },
    });

    return SurveyQuestion.create(
      mapSurveyQuestionPrismaToDomain(questionData),
      new UniqueEntityID(questionData.id),
    );
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.surveyQuestion.delete({
      where: { id: id.toString(), ...(tenantId && { tenantId }), },
    });
  }

  async deleteBySurvey(surveyId: UniqueEntityID): Promise<void> {
    await prisma.surveyQuestion.deleteMany({
      where: { surveyId: surveyId.toString() },
    });
  }
}
