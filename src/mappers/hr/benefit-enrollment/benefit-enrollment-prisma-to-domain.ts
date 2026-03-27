import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BenefitEnrollment as PrismaBenefitEnrollment } from '@prisma/generated/client.js';

export function mapBenefitEnrollmentPrismaToDomain(
  enrollment: PrismaBenefitEnrollment,
) {
  return {
    tenantId: new UniqueEntityID(enrollment.tenantId),
    employeeId: new UniqueEntityID(enrollment.employeeId),
    benefitPlanId: new UniqueEntityID(enrollment.benefitPlanId),
    startDate: enrollment.startDate,
    endDate: enrollment.endDate ?? undefined,
    status: enrollment.status,
    employeeContribution: Number(enrollment.employeeContribution ?? 0),
    employerContribution: Number(enrollment.employerContribution ?? 0),
    dependantIds: (enrollment.dependantIds as string[]) ?? undefined,
    metadata: (enrollment.metadata as Record<string, unknown>) ?? undefined,
    createdAt: enrollment.createdAt,
    updatedAt: enrollment.updatedAt,
  };
}
