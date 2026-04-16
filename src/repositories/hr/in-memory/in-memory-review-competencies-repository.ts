import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ReviewCompetency } from '@/entities/hr/review-competency';
import type {
  CreateReviewCompetencySchema,
  ReviewCompetenciesRepository,
  UpdateReviewCompetencySchema,
} from '../review-competencies-repository';

export class InMemoryReviewCompetenciesRepository
  implements ReviewCompetenciesRepository
{
  public items: ReviewCompetency[] = [];

  async create(
    data: CreateReviewCompetencySchema,
  ): Promise<ReviewCompetency> {
    const competency = ReviewCompetency.create({
      tenantId: new UniqueEntityID(data.tenantId),
      reviewId: data.reviewId,
      name: data.name,
      selfScore: data.selfScore,
      managerScore: data.managerScore,
      weight: data.weight ?? 1.0,
      comments: data.comments,
    });

    this.items.push(competency);
    return competency;
  }

  async bulkCreate(
    competencies: CreateReviewCompetencySchema[],
  ): Promise<ReviewCompetency[]> {
    const created: ReviewCompetency[] = [];
    for (const input of competencies) {
      const competency = await this.create(input);
      created.push(competency);
    }
    return created;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCompetency | null> {
    return (
      this.items.find(
        (competency) =>
          competency.id.equals(id) &&
          competency.tenantId.toString() === tenantId &&
          !competency.isDeleted(),
      ) ?? null
    );
  }

  async findManyByReview(
    reviewId: UniqueEntityID,
    tenantId: string,
  ): Promise<ReviewCompetency[]> {
    return this.items
      .filter(
        (competency) =>
          competency.reviewId.equals(reviewId) &&
          competency.tenantId.toString() === tenantId &&
          !competency.isDeleted(),
      )
      .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime());
  }

  async update(
    data: UpdateReviewCompetencySchema,
  ): Promise<ReviewCompetency | null> {
    const index = this.items.findIndex((competency) =>
      competency.id.equals(data.id),
    );
    if (index === -1) return null;

    const competency = this.items[index];
    competency.updateScores({
      name: data.name,
      selfScore: data.selfScore,
      managerScore: data.managerScore,
      weight: data.weight,
      comments: data.comments,
    });

    return competency;
  }

  async softDelete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((competency) => competency.id.equals(id));
    if (index === -1) return;
    this.items[index].softDelete();
  }
}
