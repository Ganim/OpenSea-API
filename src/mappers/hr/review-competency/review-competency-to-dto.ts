import type { ReviewCompetency } from '@/entities/hr/review-competency';

export interface ReviewCompetencyDTO {
  id: string;
  reviewId: string;
  name: string;
  selfScore: number | null;
  managerScore: number | null;
  weight: number;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export function reviewCompetencyToDTO(
  competency: ReviewCompetency,
): ReviewCompetencyDTO {
  return {
    id: competency.id.toString(),
    reviewId: competency.reviewId.toString(),
    name: competency.name,
    selfScore: competency.selfScore ?? null,
    managerScore: competency.managerScore ?? null,
    weight: competency.weight,
    comments: competency.comments ?? null,
    createdAt: competency.createdAt.toISOString(),
    updatedAt: competency.updatedAt.toISOString(),
  };
}
