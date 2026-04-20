import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FaceEnrollment } from '@/entities/hr/face-enrollment';

import type { FaceEnrollmentsRepository } from '../face-enrollments-repository';

/**
 * In-memory implementation for unit tests. Mirrors the semantics of
 * {@link PrismaFaceEnrollmentsRepository}:
 *   - tenantId filter on every query
 *   - soft-deleted rows excluded from find* / count
 *   - public `items` array so specs can assert directly
 */
export class InMemoryFaceEnrollmentsRepository
  implements FaceEnrollmentsRepository
{
  public items: FaceEnrollment[] = [];

  async createMany(enrollments: FaceEnrollment[]): Promise<void> {
    this.items.push(...enrollments);
  }

  async findByEmployeeId(
    employeeId: string,
    tenantId: string,
  ): Promise<FaceEnrollment[]> {
    return this.items.filter(
      (e) =>
        e.employeeId.toString() === employeeId &&
        e.tenantId.toString() === tenantId &&
        !e.deletedAt,
    );
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FaceEnrollment | null> {
    return (
      this.items.find(
        (e) =>
          e.id.toString() === id.toString() &&
          e.tenantId.toString() === tenantId &&
          !e.deletedAt,
      ) ?? null
    );
  }

  async softDeleteAllByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<number> {
    let count = 0;
    for (const e of this.items) {
      if (
        e.employeeId.toString() === employeeId &&
        e.tenantId.toString() === tenantId &&
        !e.deletedAt
      ) {
        e.softDelete();
        count++;
      }
    }
    return count;
  }

  async countByEmployeeId(
    employeeId: string,
    tenantId: string,
  ): Promise<number> {
    return this.items.filter(
      (e) =>
        e.employeeId.toString() === employeeId &&
        e.tenantId.toString() === tenantId &&
        !e.deletedAt,
    ).length;
  }
}
