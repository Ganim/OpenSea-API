import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { FaceEnrollment } from '@/entities/hr/face-enrollment';
import { prisma } from '@/lib/prisma';
import { mapFaceEnrollmentPrismaToDomain } from '@/mappers/hr/face-enrollment/prisma-to-domain';

import type { FaceEnrollmentsRepository } from '../face-enrollments-repository';

/**
 * Prisma implementation of {@link FaceEnrollmentsRepository}.
 *
 * Multi-tenant: every query includes `tenantId` in the `where`. Soft-delete:
 * every find/count filters by `deletedAt: null`. Reads return ciphertext;
 * decryption is the caller's responsibility (only the FaceMatchValidator
 * in Plan 05-07 decrypts, via `decryptEmbedding`).
 */
export class PrismaFaceEnrollmentsRepository
  implements FaceEnrollmentsRepository
{
  async createMany(enrollments: FaceEnrollment[]): Promise<void> {
    if (enrollments.length === 0) return;

    await prisma.$transaction(async (tx) => {
      await tx.employeeFaceEnrollment.createMany({
        data: enrollments.map((e) => ({
          id: e.id.toString(),
          tenantId: e.tenantId.toString(),
          employeeId: e.employeeId.toString(),
          embedding: e.embedding,
          iv: e.iv,
          authTag: e.authTag,
          photoCount: e.photoCount,
          capturedAt: e.capturedAt,
          capturedByUserId: e.capturedByUserId.toString(),
          consentAuditLogId: e.consentAuditLogId,
          createdAt: e.createdAt,
        })),
      });
    });
  }

  async findByEmployeeId(
    employeeId: string,
    tenantId: string,
  ): Promise<FaceEnrollment[]> {
    const rows = await prisma.employeeFaceEnrollment.findMany({
      where: { tenantId, employeeId, deletedAt: null },
      orderBy: { capturedAt: 'asc' },
    });
    return rows.map(mapFaceEnrollmentPrismaToDomain);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<FaceEnrollment | null> {
    const row = await prisma.employeeFaceEnrollment.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });
    return row ? mapFaceEnrollmentPrismaToDomain(row) : null;
  }

  async softDeleteAllByEmployee(
    employeeId: string,
    tenantId: string,
  ): Promise<number> {
    const result = await prisma.employeeFaceEnrollment.updateMany({
      where: { tenantId, employeeId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    return result.count;
  }

  async countByEmployeeId(
    employeeId: string,
    tenantId: string,
  ): Promise<number> {
    return prisma.employeeFaceEnrollment.count({
      where: { tenantId, employeeId, deletedAt: null },
    });
  }
}
