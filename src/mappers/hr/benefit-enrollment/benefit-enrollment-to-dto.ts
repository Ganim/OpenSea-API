import type { BenefitEnrollment } from '@/entities/hr/benefit-enrollment';

export interface BenefitEnrollmentDTO {
  id: string;
  employeeId: string;
  benefitPlanId: string;
  startDate: string;
  endDate: string | null;
  status: string;
  employeeContribution: number;
  employerContribution: number;
  dependantIds: string[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export function benefitEnrollmentToDTO(
  enrollment: BenefitEnrollment,
): BenefitEnrollmentDTO {
  return {
    id: enrollment.id.toString(),
    employeeId: enrollment.employeeId.toString(),
    benefitPlanId: enrollment.benefitPlanId.toString(),
    startDate: enrollment.startDate.toISOString(),
    endDate: enrollment.endDate?.toISOString() ?? null,
    status: enrollment.status,
    employeeContribution: enrollment.employeeContribution,
    employerContribution: enrollment.employerContribution,
    dependantIds: enrollment.dependantIds ?? null,
    metadata: enrollment.metadata ?? null,
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}
