import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

export interface AcknowledgeReviewRequest {
  tenantId: string;
  performanceReviewId: string;
  /**
   * `userId` do chamador autenticado (JWT `sub`). Apenas o próprio avaliado
   * (funcionário vinculado ao `review.employeeId`) pode reconhecer a avaliação.
   */
  callerUserId: string;
}

export interface AcknowledgeReviewResponse {
  review: PerformanceReview;
}

export class AcknowledgeReviewUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: AcknowledgeReviewRequest,
  ): Promise<AcknowledgeReviewResponse> {
    const { tenantId, performanceReviewId, callerUserId } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    const reviewee = await this.employeesRepository.findById(
      review.employeeId,
      tenantId,
    );

    if (!reviewee) {
      throw new ResourceNotFoundError('Funcionário avaliado não encontrado');
    }

    if (!reviewee.userId || reviewee.userId.toString() !== callerUserId) {
      throw new ForbiddenError(
        'Apenas o próprio avaliado pode reconhecer esta avaliação',
      );
    }

    if (review.status !== 'COMPLETED') {
      throw new BadRequestError(
        'Apenas avaliações concluídas podem ser reconhecidas pelo funcionário',
      );
    }

    if (review.employeeAcknowledged) {
      throw new BadRequestError(
        'Esta avaliação já foi reconhecida pelo funcionário',
      );
    }

    review.acknowledge();

    const updatedReview = await this.performanceReviewsRepository.update({
      id: new UniqueEntityID(performanceReviewId),
      employeeAcknowledged: true,
      acknowledgedAt: review.acknowledgedAt,
    });

    if (!updatedReview) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    return { review: updatedReview };
  }
}
