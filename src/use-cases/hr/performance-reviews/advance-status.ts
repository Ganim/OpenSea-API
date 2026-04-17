import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PerformanceReview } from '@/entities/hr/performance-review';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PerformanceReviewsRepository } from '@/repositories/hr/performance-reviews-repository';

/**
 * Allowed review states that can be the ORIGIN of an advance-status call.
 * COMPLETED reviews must go through `acknowledge-review`, not this use case.
 */
const LINEAR_STATUS_FLOW: Record<string, string> = {
  PENDING: 'SELF_ASSESSMENT',
  SELF_ASSESSMENT: 'MANAGER_REVIEW',
  MANAGER_REVIEW: 'COMPLETED',
};

export interface AdvanceReviewStatusRequest {
  tenantId: string;
  performanceReviewId: string;
  /**
   * JWT `sub` — used for ownership checks so that only the reviewer (or the
   * reviewee, when advancing away from PENDING) can push the review forward.
   */
  callerUserId: string;
  /**
   * Bypass ownership checks for callers that carry `hr.reviews.admin` — the
   * controller decides when to set this flag based on the RBAC permission.
   */
  bypassOwnership?: boolean;
}

export interface AdvanceReviewStatusResponse {
  review: PerformanceReview;
}

/**
 * Advances a PerformanceReview to the next stage in the linear state machine
 * (PENDING → SELF_ASSESSMENT → MANAGER_REVIEW → COMPLETED) WITHOUT mutating
 * any score or comment fields.
 *
 * Separating this concern from `submitSelfAssessment` / `submitManagerReview`
 * fixes a P0 regression where the UI "advance status" control was overwriting
 * existing scores with 0 because the backend accepted and persisted an empty
 * score payload alongside the status change.
 */
export class AdvanceReviewStatusUseCase {
  constructor(
    private readonly performanceReviewsRepository: PerformanceReviewsRepository,
    private readonly employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: AdvanceReviewStatusRequest,
  ): Promise<AdvanceReviewStatusResponse> {
    const {
      tenantId,
      performanceReviewId,
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

    const nextStatus = LINEAR_STATUS_FLOW[review.status];

    if (!nextStatus) {
      throw new BadRequestError(
        'O status atual da avaliação não permite avanço automático',
      );
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

      const authorizedUserIds = new Set(
        [
          reviewee.userId?.toString(),
          reviewer?.userId?.toString(),
          supervisor?.userId?.toString(),
        ].filter((id): id is string => Boolean(id)),
      );

      if (!authorizedUserIds.has(callerUserId)) {
        throw new ForbiddenError(
          'Apenas o avaliado, o avaliador designado ou o supervisor direto pode avançar o status da avaliação',
        );
      }
    }

    // IMPORTANT: only `status` is written. All score / comment columns must
    // remain intact — the persisted request body MUST NOT include them, and
    // this use case MUST NOT forward them to the repository even if present.
    const patch: {
      id: UniqueEntityID;
      tenantId: string;
      status: string;
      completedAt?: Date;
    } = {
      id: new UniqueEntityID(performanceReviewId),
      tenantId,
      status: nextStatus,
    };

    if (nextStatus === 'COMPLETED') {
      patch.completedAt = new Date();
    }

    const updatedReview = await this.performanceReviewsRepository.update(patch);

    if (!updatedReview) {
      throw new ResourceNotFoundError('Avaliação de desempenho não encontrada');
    }

    return { review: updatedReview };
  }
}
