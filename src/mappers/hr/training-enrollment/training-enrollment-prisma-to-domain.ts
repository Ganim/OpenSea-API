import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TrainingEnrollment as PrismaTrainingEnrollment } from '@prisma/generated/client.js';

export function mapTrainingEnrollmentPrismaToDomain(
  enrollment: PrismaTrainingEnrollment,
) {
  return {
    tenantId: new UniqueEntityID(enrollment.tenantId),
    trainingProgramId: new UniqueEntityID(enrollment.trainingProgramId),
    employeeId: new UniqueEntityID(enrollment.employeeId),
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    startedAt: enrollment.startedAt ?? undefined,
    completedAt: enrollment.completedAt ?? undefined,
    score: enrollment.score ?? undefined,
    certificateUrl: enrollment.certificateUrl ?? undefined,
    notes: enrollment.notes ?? undefined,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}
