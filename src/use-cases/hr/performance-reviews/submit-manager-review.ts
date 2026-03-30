import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

export interface SubmitManagerReviewRequest {
  tenantId: string;
  performanceReviewId: string;
  managerScore: number;
  managerComments?: string;
  strengths?: string;
  improvements?: string;
  goals?: string;
}

export interface SubmitManagerReviewResponse {
  review: PerformanceReview;
}

export class SubmitManagerReviewUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
  ) {}

  async execute(
    request: SubmitManagerReviewRequest,
  ): Promise<SubmitManagerReviewResponse> {
    const {
      tenantId,
      performanceReviewId,
      managerScore,
      managerComments,
      strengths,
      improvements,
      goals,
    } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    if (review.status !== 'MANAGER_REVIEW') {
      throw new BadRequestError(
        'A avaliação do gestor só pode ser submetida quando o status for MANAGER_REVIEW',
      );
    }

    if (managerScore < 1 || managerScore > 5) {
      throw new BadRequestError('A nota deve ser entre 1 e 5');
    }

    review.submitManagerReview(
      managerScore,
      managerComments,
      strengths,
      improvements,
      goals,
    );

    const updatedReview = await this.performanceReviewsRepository.update({
      id: new UniqueEntityID(performanceReviewId),
      status: review.status,
      managerScore: review.managerScore,
      finalScore: review.finalScore,
      managerComments: review.managerComments,
      strengths: review.strengths,
      improvements: review.improvements,
      goals: review.goals,
      completedAt: review.completedAt,
    });

    if (!updatedReview) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    return { review: updatedReview };
  }
}
