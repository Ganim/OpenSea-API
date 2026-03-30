import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';
import type { ReviewCyclesRepository } from '@/repositories/hr/review-cycles-repository';

export interface ReviewAssignment {
  employeeId: string;
  reviewerId: string;
}

export interface CreateBulkReviewsRequest {
  tenantId: string;
  reviewCycleId: string;
  assignments: ReviewAssignment[];
}

export interface CreateBulkReviewsResponse {
  reviews: PerformanceReview[];
}

export class CreateBulkReviewsUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
    private reviewCyclesRepository: ReviewCyclesRepository,
  ) {}

  async execute(
    request: CreateBulkReviewsRequest,
  ): Promise<CreateBulkReviewsResponse> {
    const { tenantId, reviewCycleId, assignments } = request;

    const reviewCycle = await this.reviewCyclesRepository.findById(
      new UniqueEntityID(reviewCycleId),
      tenantId,
    );

    if (!reviewCycle) {
      throw new ResourceNotFoundError('Ciclo de avaliação não encontrado');
    }

    if (reviewCycle.status === 'CLOSED') {
      throw new BadRequestError(
        'Não é possível criar avaliações em um ciclo fechado',
      );
    }

    if (assignments.length === 0) {
      throw new BadRequestError(
        'É necessário informar pelo menos uma atribuição',
      );
    }

    const reviewSchemas = assignments.map((assignment) => ({
      tenantId,
      reviewCycleId: new UniqueEntityID(reviewCycleId),
      employeeId: new UniqueEntityID(assignment.employeeId),
      reviewerId: new UniqueEntityID(assignment.reviewerId),
    }));

    const reviews =
      await this.performanceReviewsRepository.bulkCreate(reviewSchemas);

    return { reviews };
  }
}
