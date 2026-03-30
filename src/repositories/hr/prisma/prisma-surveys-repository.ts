import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Survey } from '@/entities/hr/survey';
import { prisma } from '@/lib/prisma';
import { mapSurveyPrismaToDomain } from '@/mappers/hr/survey';
import type {
  CreateSurveySchema,
  FindSurveyFilters,
  SurveysRepository,
  UpdateSurveySchema,
} from '../surveys-repository';

export class PrismaSurveysRepository implements SurveysRepository {
  async create(data: CreateSurveySchema): Promise<Survey> {
    const surveyData = await prisma.survey.create({
      data: {
        tenantId: data.tenantId,
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status ?? 'DRAFT',
        isAnonymous: data.isAnonymous ?? false,
        startDate: data.startDate,
        endDate: data.endDate,
        createdBy: data.createdBy.toString(),
      },
    });

    return Survey.create(
      mapSurveyPrismaToDomain(surveyData),
      new UniqueEntityID(surveyData.id),
    );
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Survey | null> {
    const surveyData = await prisma.survey.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!surveyData) return null;

    return Survey.create(
      mapSurveyPrismaToDomain(surveyData),
      new UniqueEntityID(surveyData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindSurveyFilters,
  ): Promise<{ surveys: Survey[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      type: filters?.type,
      status: filters?.status,
      createdBy: filters?.createdBy?.toString(),
    };

    const [surveysData, total] = await Promise.all([
      prisma.survey.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.survey.count({ where }),
    ]);

    const surveys = surveysData.map((s) =>
      Survey.create(mapSurveyPrismaToDomain(s), new UniqueEntityID(s.id)),
    );

    return { surveys, total };
  }

  async update(data: UpdateSurveySchema): Promise<Survey | null> {
    const existing = await prisma.survey.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existing) return null;

    const surveyData = await prisma.survey.update({
      where: { id: data.id.toString() },
      data: {
        title: data.title,
        description: data.description,
        type: data.type,
        status: data.status,
        isAnonymous: data.isAnonymous,
        startDate: data.startDate,
        endDate: data.endDate,
      },
    });

    return Survey.create(
      mapSurveyPrismaToDomain(surveyData),
      new UniqueEntityID(surveyData.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.survey.delete({
      where: { id: id.toString() },
    });
  }
}
