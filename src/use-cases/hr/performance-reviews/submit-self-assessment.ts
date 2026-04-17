import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

export interface SubmitSelfAssessmentRequest {
  tenantId: string;
  performanceReviewId: string;
  selfScore: number;
  selfComments?: string;
  strengths?: string;
  improvements?: string;
  goals?: string;
  /**
   * `userId` do chamador autenticado (JWT `sub`). Somente o próprio avaliado
   * (funcionário vinculado ao `review.employeeId`) pode submeter a autoavaliação.
   */
  callerUserId: string;
}

export interface SubmitSelfAssessmentResponse {
  review: PerformanceReview;
}

export class SubmitSelfAssessmentUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: SubmitSelfAssessmentRequest,
  ): Promise<SubmitSelfAssessmentResponse> {
    const {
      tenantId,
      performanceReviewId,
      selfScore,
      selfComments,
      strengths,
      improvements,
      goals,
      callerUserId,
    } = request;

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
        'Apenas o próprio avaliado pode submeter a autoavaliação',
      );
    }

    if (review.status !== 'PENDING' && review.status !== 'SELF_ASSESSMENT') {
      throw new BadRequestError(
        'A autoavaliação só pode ser submetida quando o status for PENDING ou SELF_ASSESSMENT',
      );
    }

    if (selfScore < 1 || selfScore > 5) {
      throw new BadRequestError('A nota deve ser entre 1 e 5');
    }

    review.submitSelfAssessment(
      selfScore,
      selfComments,
      strengths,
      improvements,
      goals,
    );

    const updatedReview = await this.performanceReviewsRepository.update({
      id: new UniqueEntityID(performanceReviewId),
      status: review.status,
      selfScore: review.selfScore,
      selfComments: review.selfComments,
      strengths: review.strengths,
      improvements: review.improvements,
      goals: review.goals,
    });

    if (!updatedReview) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    return { review: updatedReview };
  }
}
