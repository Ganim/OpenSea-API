import type { PerformanceReview } from '@/entities/hr/performance-review';

export interface PerformanceReviewDTO {
  id: string;
  reviewCycleId: string;
  employeeId: string;
  reviewerId: string;
  status: string;
  selfScore: number | null;
  managerScore: number | null;
  finalScore: number | null;
  selfComments: string | null;
  managerComments: string | null;
  strengths: string | null;
  improvements: string | null;
  goals: string | null;
  employeeAcknowledged: boolean;
  acknowledgedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function performanceReviewToDTO(
  review: PerformanceReview,
): PerformanceReviewDTO {
  return {
    id: review.id.toString(),
    reviewCycleId: review.reviewCycleId.toString(),
    employeeId: review.employeeId.toString(),
    reviewerId: review.reviewerId.toString(),
    status: review.status,
    selfScore: review.selfScore ?? null,
    managerScore: review.managerScore ?? null,
    finalScore: review.finalScore ?? null,
    selfComments: review.selfComments ?? null,
    managerComments: review.managerComments ?? null,
    strengths: review.strengths ?? null,
    improvements: review.improvements ?? null,
    goals: review.goals ?? null,
    employeeAcknowledged: review.employeeAcknowledged,
    acknowledgedAt: review.acknowledgedAt?.toISOString() ?? null,
    completedAt: review.completedAt?.toISOString() ?? null,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };
}
