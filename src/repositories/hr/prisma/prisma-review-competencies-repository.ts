import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReviewCompetency } from '@/entities/hr/review-competency';
import { prisma } from '@/lib/prisma';
import { mapReviewCompetencyPrismaToDomain } from '@/mappers/hr/review-competency';
import type {
  CreateReviewCompetencySchema,
  ReviewCompetenciesRepository,
  UpdateReviewCompetencySchema,
} from '../review-competencies-repository';

export class PrismaReviewCompetenciesRepository
  implements ReviewCompetenciesRepository
{
  async create(data: CreateReviewCompetencySchema): Promise<ReviewCompetency> {
    const competencyData = await prisma.reviewCompetency.create({
      data: {
        tenantId: data.tenantId,
        reviewId: data.reviewId.toString(),
        name: data.name,
        selfScore: data.selfScore,
        managerScore: data.managerScore,
        weight: data.weight ?? 1.0,
        comments: data.comments,
      },
    });

    return ReviewCompetency.create(
      mapReviewCompetencyPrismaToDomain(competencyData),
      new UniqueEntityID(competencyData.id),
    );
  }

  async bulkCreate(
    competencies: CreateReviewCompetencySchema[],
  ): Promise<ReviewCompetency[]> {
    const created: ReviewCompetency[] = [];

    for (const input of competencies) {
      const competencyData = await prisma.reviewCompetency.create({
        data: {
          tenantId: input.tenantId,
          reviewId: input.reviewId.toString(),
          name: input.name,
          selfScore: input.selfScore,
          managerScore: input.managerScore,
          weight: input.weight ?? 1.0,
          comments: input.comments,
        },
      });

      created.push(
        ReviewCompetency.create(
          mapReviewCompetencyPrismaToDomain(competencyData),
          new UniqueEntityID(competencyData.id),
        ),
      );
    }

    return created;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCompetency | null> {
    const competencyData = await prisma.reviewCompetency.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!competencyData) return null;

    return ReviewCompetency.create(
      mapReviewCompetencyPrismaToDomain(competencyData),
      new UniqueEntityID(competencyData.id),
    );
  }

  async findManyByReview(
    reviewId: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCompetency[]> {
    const competenciesData = await prisma.reviewCompetency.findMany({
      where: {
        reviewId: reviewId.toString(),
        tenantId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
    });

    return competenciesData.map((competencyData) =>
      ReviewCompetency.create(
        mapReviewCompetencyPrismaToDomain(competencyData),
        new UniqueEntityID(competencyData.id),
      ),
    );
  }

  async update(
    data: UpdateReviewCompetencySchema,
  ): Promise<ReviewCompetency | null> {
    const existing = await prisma.reviewCompetency.findUnique({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
    });

    if (!existing || existing.deletedAt) return null;

    const competencyData = await prisma.reviewCompetency.update({
      where: {
        id: data.id.toString(),
        ...(data.tenantId && { tenantId: data.tenantId }),
      },
      data: {
        name: data.name,
        selfScore: data.selfScore,
        managerScore: data.managerScore,
        weight: data.weight,
        comments: data.comments,
      },
    });

    return ReviewCompetency.create(
      mapReviewCompetencyPrismaToDomain(competencyData),
      new UniqueEntityID(competencyData.id),
    );
  }

  async softDelete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    await prisma.reviewCompetency.update({
      where: {
        id: id.toString(),
        ...(tenantId && { tenantId }),
      },
      data: { deletedAt: new Date() },
    });
  }
}
