import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FaceEnrollment } from '@/entities/hr/face-enrollment';

/**
 * Repository contract for {@link FaceEnrollment}.
 *
 * Multi-tenant: every method takes `tenantId`; concrete implementations
 * filter it in every `where` clause. Soft-deleted rows (deletedAt != null)
 * are NEVER returned by find* methods — use a custom query if auditing
 * deleted enrollments is needed in the future.
 *
 * The `createMany` method is the only write path: enrollment creation
 * happens in batches of 3-5 per D-05. Individual-row writes are not
 * supported to enforce the "capture all or none" atomicity guarantee.
 */
export interface FaceEnrollmentsRepository {
  createMany(enrollments: FaceEnrollment[]): Promise<void>;
  findByEmployeeId(
    employeeId: string,
    tenantId: string,
  ): Promise<FaceEnrollment[]>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FaceEnrollment | null>;
  /**
   * Marks every active enrollment for `employeeId` (scoped by tenantId) as
   * soft-deleted. Returns the number of rows affected, used by the
   * CreateFaceEnrollmentsUseCase (replace policy D-05) and the
   * RemoveFaceEnrollmentsUseCase (admin unenrollment).
   */
  softDeleteAllByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<number>;
  countByEmployeeId(employeeId: string, tenantId: string): Promise<number>;
}
