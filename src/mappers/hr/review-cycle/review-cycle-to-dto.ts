import type { ReviewCycle } from '@/entities/hr/review-cycle';

export interface ReviewCycleDTO {
  id: string;
  name: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function reviewCycleToDTO(cycle: ReviewCycle): ReviewCycleDTO {
  return {
    id: cycle.id.toString(),
    name: cycle.name,
    description: cycle.description ?? null,
    type: cycle.type,
    startDate: cycle.startDate.toISOString(),
    endDate: cycle.endDate.toISOString(),
    status: cycle.status,
    isActive: cycle.isActive,
    createdAt: cycle.createdAt.toISOString(),
    updatedAt: cycle.updatedAt.toISOString(),
  };
}
