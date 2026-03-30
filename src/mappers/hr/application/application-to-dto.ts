import type { Application } from '@/entities/hr/application';

export interface ApplicationDTO {
  id: string;
  jobPostingId: string;
  candidateId: string;
  status: string;
  currentStageId: string | null;
  appliedAt: string;
  rejectedAt: string | null;
  rejectionReason: string | null;
  hiredAt: string | null;
  rating: number | null;
  createdAt: string;
  updatedAt: string;
}

export function applicationToDTO(application: Application): ApplicationDTO {
  return {
    id: application.id.toString(),
    jobPostingId: application.jobPostingId.toString(),
    candidateId: application.candidateId.toString(),
    status: application.status,
    currentStageId: application.currentStageId?.toString() ?? null,
    appliedAt: application.appliedAt.toISOString(),
    rejectedAt: application.rejectedAt?.toISOString() ?? null,
    rejectionReason: application.rejectionReason ?? null,
    hiredAt: application.hiredAt?.toISOString() ?? null,
    rating: application.rating ?? null,
    createdAt: application.createdAt.toISOString(),
    updatedAt: application.updatedAt.toISOString(),
  };
}
