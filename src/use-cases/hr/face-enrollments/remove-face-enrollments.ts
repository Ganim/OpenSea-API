import type { FaceEnrollmentsRepository } from '@/repositories/hr/face-enrollments-repository';

export interface RemoveFaceEnrollmentsRequest {
  tenantId: string;
  employeeId: string;
}

export interface RemoveFaceEnrollmentsResponse {
  /** Number of rows soft-deleted (0 if none were active). */
  removedCount: number;
}

/**
 * Admin-triggered soft-delete of every active face enrollment for an
 * employee (D-05 "Remover biometria"). Idempotent by design: calling it
 * twice in a row produces `{ removedCount: 0 }` on the second call.
 *
 * The controller writes a `PUNCH_FACE_ENROLLMENT_REMOVED` audit log after
 * the use case returns (includes the removed count in placeholders).
 */
export class RemoveFaceEnrollmentsUseCase {
  constructor(private readonly repo: FaceEnrollmentsRepository) {}

  async execute(
    input: RemoveFaceEnrollmentsRequest,
  ): Promise<RemoveFaceEnrollmentsResponse> {
    const removedCount = await this.repo.softDeleteAllByEmployee(
      input.employeeId,
      input.tenantId,
    );
    return { removedCount };
  }
}
