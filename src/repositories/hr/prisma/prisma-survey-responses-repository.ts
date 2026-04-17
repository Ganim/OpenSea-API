import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SurveyResponse } from '@/entities/hr/survey-response';
import { prisma } from '@/lib/prisma';
import { mapSurveyResponsePrismaToDomain } from '@/mappers/hr/survey-response';
import type {
  CreateSurveyResponseSchema,
  FindSurveyResponseFilters,
  SurveyResponsesRepository,
} from '../survey-responses-repository';

export class PrismaSurveyResponsesRepository
  implements SurveyResponsesRepository
{
  async create(data: CreateSurveyResponseSchema): Promise<SurveyResponse> {
    const responseData = await prisma.surveyResponse.create({
      data: {
        tenantId: data.tenantId,
        surveyId: data.surveyId.toString(),
        employeeId: data.employeeId?.toString() ?? null,
        respondentHash: data.respondentHash ?? null,
      },
    });

    return SurveyResponse.create(
      mapSurveyResponsePrismaToDomain(responseData),
      new UniqueEntityID(responseData.id),
    );
  }

  async findByRespondentHash(
    surveyId: UniqueEntityID,
    respondentHash: string,
    tenantId: string,
  ): Promise<SurveyResponse | null> {
    const responseData = await prisma.surveyResponse.findFirst({
      where: {
        surveyId: surveyId.toString(),
        respondentHash,
        tenantId,
      },
    });

    if (!responseData) return null;

    return SurveyResponse.create(
      mapSurveyResponsePrismaToDomain(responseData),
      new UniqueEntityID(responseData.id),
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyResponse | null> {
    const responseData = await prisma.surveyResponse.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!responseData) return null;

    return SurveyResponse.create(
      mapSurveyResponsePrismaToDomain(responseData),
      new UniqueEntityID(responseData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindSurveyResponseFilters,
  ): Promise<{ responses: SurveyResponse[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      surveyId: filters?.surveyId?.toString(),
      employeeId: filters?.employeeId?.toString(),
    };

    const [responsesData, total] = await Promise.all([
      prisma.surveyResponse.findMany({
        where,
        orderBy: { submittedAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.surveyResponse.count({ where }),
    ]);

    const responses = responsesData.map((r) =>
      SurveyResponse.create(
        mapSurveyResponsePrismaToDomain(r),
        new UniqueEntityID(r.id),
      ),
    );

    return { responses, total };
  }

  async findByEmployeeAndSurvey(
    employeeId: UniqueEntityID,
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<SurveyResponse | null> {
    const responseData = await prisma.surveyResponse.findFirst({
      where: {
        employeeId: employeeId.toString(),
        surveyId: surveyId.toString(),
        tenantId,
      },
    });

    if (!responseData) return null;

    return SurveyResponse.create(
      mapSurveyResponsePrismaToDomain(responseData),
      new UniqueEntityID(responseData.id),
    );
  }

  async countBySurvey(
    surveyId: UniqueEntityID,
    tenantId: string,
  ): Promise<number> {
    return prisma.surveyResponse.count({
      where: { surveyId: surveyId.toString(), tenantId },
    });
  }
}
