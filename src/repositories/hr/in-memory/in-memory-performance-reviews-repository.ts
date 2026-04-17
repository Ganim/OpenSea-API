import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PerformanceReview } from '@/entities/hr/performance-review';
import type {
  CreatePerformanceReviewSchema,
  FindPerformanceReviewFilters,
  PerformanceReviewsRepository,
  UpdatePerformanceReviewSchema,
} from '../performance-reviews-repository';

export class InMemoryPerformanceReviewsRepository
  implements PerformanceReviewsRepository
{
  public items: PerformanceReview[] = [];

  async create(
    data: CreatePerformanceReviewSchema,
  ): Promise<PerformanceReview> {
    const review = PerformanceReview.create({
      tenantId: new UniqueEntityID(data.tenantId),
      reviewCycleId: data.reviewCycleId,
      employeeId: data.employeeId,
      reviewerId: data.reviewerId,
      status: data.status ?? 'PENDING',
      employeeAcknowledged: false,
    });

    this.items.push(review);
    return review;
  }

  async bulkCreate(
    reviews: CreatePerformanceReviewSchema[],
  ): Promise<PerformanceReview[]> {
    const createdReviews: PerformanceReview[] = [];

    for (const reviewInput of reviews) {
      const review = await this.create(reviewInput);
      createdReviews.push(review);
    }

    return createdReviews;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PerformanceReview | null> {
    return (
      this.items.find(
        (review) =>
          review.id.equals(id) && review.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindPerformanceReviewFilters,
  ): Promise<{ reviews: PerformanceReview[]; total: number }> {
    let filtered = this.items.filter(
      (review) => review.tenantId.toString() === tenantId,
    );

    if (filters?.reviewCycleId) {
      filtered = filtered.filter((review) =>
        review.reviewCycleId.equals(filters.reviewCycleId!),
      );
    }
    if (filters?.employeeId) {
      filtered = filtered.filter((review) =>
        review.employeeId.equals(filters.employeeId!),
      );
    }
    if (filters?.reviewerId) {
      filtered = filtered.filter((review) =>
        review.reviewerId.equals(filters.reviewerId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter((review) => review.status === filters.status);
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      reviews: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async findByCycleAndEmployee(
    reviewCycleId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<PerformanceReview | null> {
    return (
      this.items.find(
        (review) =>
          review.reviewCycleId.equals(reviewCycleId) &&
          review.employeeId.equals(employeeId) &&
          review.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async update(
    data: UpdatePerformanceReviewSchema,
  ): Promise<PerformanceReview | null> {
    const index = this.items.findIndex((review) => review.id.equals(data.id));
    if (index === -1) return null;

    const review = this.items[index];

    if (data.status !== undefined) {
      review.props.status = data.status;
      review.props.updatedAt = new Date();
    }
    if (data.selfScore !== undefined) {
      review.props.selfScore = data.selfScore;
      review.props.updatedAt = new Date();
    }
    if (data.managerScore !== undefined) {
      review.props.managerScore = data.managerScore;
      review.props.updatedAt = new Date();
    }
    if (data.finalScore !== undefined) {
      review.props.finalScore = data.finalScore;
      review.props.updatedAt = new Date();
    }
    if (data.selfComments !== undefined) {
      review.props.selfComments = data.selfComments;
      review.props.updatedAt = new Date();
    }
    if (data.managerComments !== undefined) {
      review.props.managerComments = data.managerComments;
      review.props.updatedAt = new Date();
    }
    if (data.strengths !== undefined) {
      review.props.strengths = data.strengths;
      review.props.updatedAt = new Date();
    }
    if (data.improvements !== undefined) {
      review.props.improvements = data.improvements;
      review.props.updatedAt = new Date();
    }
    if (data.goals !== undefined) {
      review.props.goals = data.goals;
      review.props.updatedAt = new Date();
    }
    if (data.employeeAcknowledged !== undefined) {
      review.props.employeeAcknowledged = data.employeeAcknowledged;
      review.props.updatedAt = new Date();
    }
    if (data.acknowledgedAt !== undefined) {
      review.props.acknowledgedAt = data.acknowledgedAt;
      review.props.updatedAt = new Date();
    }
    if (data.completedAt !== undefined) {
      review.props.completedAt = data.completedAt;
      review.props.updatedAt = new Date();
    }

    return review;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((review) => review.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
