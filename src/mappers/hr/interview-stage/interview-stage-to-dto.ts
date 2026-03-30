import type { InterviewStage } from '@/entities/hr/interview-stage';

export interface InterviewStageDTO {
  id: string;
  jobPostingId: string;
  name: string;
  order: number;
  type: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export function interviewStageToDTO(
  stage: InterviewStage,
): InterviewStageDTO {
  return {
    id: stage.id.toString(),
    jobPostingId: stage.jobPostingId.toString(),
    name: stage.name,
    order: stage.order,
    type: stage.type,
    description: stage.description ?? null,
    createdAt: stage.createdAt.toISOString(),
    updatedAt: stage.updatedAt.toISOString(),
  };
}
