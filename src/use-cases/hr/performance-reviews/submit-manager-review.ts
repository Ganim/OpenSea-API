import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

export interface SubmitManagerReviewRequest {
  tenantId: string;
  performanceReviewId: string;
  managerScore: number;
  managerComments?: string;
  strengths?: string;
  improvements?: string;
  goals?: string;
  /**
   * `userId` do chamador autenticado (JWT `sub`). A submissão da avaliação do
   * gestor só pode ser feita pelo funcionário designado como avaliador
   * (`review.reviewerId`) ou pelo supervisor direto do avaliado. Callers com
   * a permissão `hr.reviews.admin` devem ser autorizados no controller —
   * passe `bypassOwnership: true` apenas nesse caso.
   */
  callerUserId: string;
  /**
   * Quando `true`, pula a verificação de propriedade (usar apenas quando o
   * chamador tem `hr.reviews.admin`). Controle desta flag fica no controller.
   */
  bypassOwnership?: boolean;
}

export interface SubmitManagerReviewResponse {
  review: PerformanceReview;
}

export class SubmitManagerReviewUseCase {
  constructor(
    private performanceReviewsRepository: PerformanceReviewsRepository,
    private employeesRepository: EmployeesRepository,
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
      callerUserId,
      bypassOwnership = false,
    } = request;

    const review = await this.performanceReviewsRepository.findById(
      new UniqueEntityID(performanceReviewId),
      tenantId,
    );

    if (!review) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    if (!bypassOwnership) {
      const reviewee = await this.employeesRepository.findById(
        review.employeeId,
        tenantId,
      );

      if (!reviewee) {
        throw new ResourceNotFoundError('Funcionário avaliado não encontrado');
      }

      const reviewer = await this.employeesRepository.findById(
        review.reviewerId,
        tenantId,
      );

      const supervisor = reviewee.supervisorId
        ? await this.employeesRepository.findById(
            reviewee.supervisorId,
            tenantId,
          )
        : null;

      const authorizedUserIds = [
        reviewer?.userId?.toString(),
        supervisor?.userId?.toString(),
      ].filter((id): id is string => Boolean(id));

      if (!authorizedUserIds.includes(callerUserId)) {
        throw new ForbiddenError(
          'Apenas o avaliador designado ou o supervisor direto pode submeter a avaliação do gestor',
        );
      }
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
