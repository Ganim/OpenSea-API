import type { TrainingEnrollment } from '@/entities/hr/training-enrollment';

export interface TrainingEnrollmentDTO {
  id: string;
  trainingProgramId: string;
  employeeId: string;
  status: string;
  enrolledAt: string;
  startedAt: string | null;
  completedAt: string | null;
  score: number | null;
  certificateUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function trainingEnrollmentToDTO(
  enrollment: TrainingEnrollment,
): TrainingEnrollmentDTO {
  return {
    id: enrollment.id.toString(),
    trainingProgramId: enrollment.trainingProgramId.toString(),
    employeeId: enrollment.employeeId.toString(),
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt.toISOString(),
    startedAt: enrollment.startedAt?.toISOString() ?? null,
    completedAt: enrollment.completedAt?.toISOString() ?? null,
    score: enrollment.score ?? null,
    certificateUrl: enrollment.certificateUrl ?? null,
    notes: enrollment.notes ?? null,
    createdAt: enrollment.createdAt.toISOString(),
    updatedAt: enrollment.updatedAt.toISOString(),
  };
}
