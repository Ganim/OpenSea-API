import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PerformanceReview } from '@/entities/hr/performance-review';
import { prisma } from '@/lib/prisma';
import { mapPerformanceReviewPrismaToDomain } from '@/mappers/hr/performance-review';
import type {
  CreatePerformanceReviewSchema,
  FindPerformanceReviewFilters,
  PerformanceReviewsRepository,
  UpdatePerformanceReviewSchema,
} from '../performance-reviews-repository';

export class PrismaPerformanceReviewsRepository
  implements PerformanceReviewsRepository
{
  async create(
    data: CreatePerformanceReviewSchema,
  ): Promise<PerformanceReview> {
    const reviewData = await prisma.performanceReview.create({
      data: {
        tenantId: data.tenantId,
        reviewCycleId: data.reviewCycleId.toString(),
        employeeId: data.employeeId.toString(),
        reviewerId: data.reviewerId.toString(),
        status: data.status ?? 'PENDING',
      },
    });

    return PerformanceReview.create(
      mapPerformanceReviewPrismaToDomain(reviewData),
      new UniqueEntityID(reviewData.id),
    );
  }

  async bulkCreate(
    reviews: CreatePerformanceReviewSchema[],
  ): Promise<PerformanceReview[]> {
    const createdReviews: PerformanceReview[] = [];

    for (const reviewInput of reviews) {
      const reviewData = await prisma.performanceReview.create({
        data: {
          tenantId: reviewInput.tenantId,
          reviewCycleId: reviewInput.reviewCycleId.toString(),
          employeeId: reviewInput.employeeId.toString(),
          reviewerId: reviewInput.reviewerId.toString(),
          status: reviewInput.status ?? 'PENDING',
        },
      });

      createdReviews.push(
        PerformanceReview.create(
          mapPerformanceReviewPrismaToDomain(reviewData),
          new UniqueEntityID(reviewData.id),
        ),
      );
    }

    return createdReviews;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PerformanceReview | null> {
    const reviewData = await prisma.performanceReview.findFirst({
      where: { id: id.toString(), tenantId },
    });

    if (!reviewData) return null;

    return PerformanceReview.create(
      mapPerformanceReviewPrismaToDomain(reviewData),
      new UniqueEntityID(reviewData.id),
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindPerformanceReviewFilters,
  ): Promise<{ reviews: PerformanceReview[]; total: number }> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);
    const skip = (page - 1) * perPage;

    const where = {
      tenantId,
      reviewCycleId: filters?.reviewCycleId?.toString(),
      employeeId: filters?.employeeId?.toString(),
      reviewerId: filters?.reviewerId?.toString(),
      status: filters?.status,
    };

    const [reviewsData, total] = await Promise.all([
      prisma.performanceReview.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
      }),
      prisma.performanceReview.count({ where }),
    ]);

    const reviews = reviewsData.map((review) =>
      PerformanceReview.create(
        mapPerformanceReviewPrismaToDomain(review),
        new UniqueEntityID(review.id),
      ),
    );

    return { reviews, total };
  }

  async findByCycleAndEmployee(
    reviewCycleId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PerformanceReview | null> {
    const reviewData = await prisma.performanceReview.findFirst({
      where: {
        reviewCycleId: reviewCycleId.toString(),
        employeeId: employeeId.toString(),
        tenantId,
      },
    });

    if (!reviewData) return null;

    return PerformanceReview.create(
      mapPerformanceReviewPrismaToDomain(reviewData),
      new UniqueEntityID(reviewData.id),
    );
  }

  async update(
    data: UpdatePerformanceReviewSchema,
  ): Promise<PerformanceReview | null> {
    const existingReview = await prisma.performanceReview.findUnique({
      where: { id: data.id.toString() },
    });

    if (!existingReview) return null;

    const reviewData = await prisma.performanceReview.update({
      where: { id: data.id.toString() },
      data: {
        status: data.status,
        selfScore: data.selfScore,
        managerScore: data.managerScore,
        finalScore: data.finalScore,
        selfComments: data.selfComments,
        managerComments: data.managerComments,
        strengths: data.strengths,
        improvements: data.improvements,
        goals: data.goals,
        employeeAcknowledged: data.employeeAcknowledged,
        acknowledgedAt: data.acknowledgedAt,
        completedAt: data.completedAt,
      },
    });

    return PerformanceReview.create(
      mapPerformanceReviewPrismaToDomain(reviewData),
      new UniqueEntityID(reviewData.id),
    );
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.performanceReview.delete({
      where: { id: id.toString() },
    });
  }
}
