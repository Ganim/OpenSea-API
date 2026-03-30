import type { Objective } from '@/entities/hr/objective';

export interface ObjectiveDTO {
  id: string;
  title: string;
  description: string | null;
  ownerId: string;
  parentId: string | null;
  level: string;
  status: string;
  period: string;
  startDate: string;
  endDate: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
}

export function objectiveToDTO(objective: Objective): ObjectiveDTO {
  return {
    id: objective.id.toString(),
    title: objective.title,
    description: objective.description ?? null,
    ownerId: objective.ownerId.toString(),
    parentId: objective.parentId?.toString() ?? null,
    level: objective.level,
    status: objective.status,
    period: objective.period,
    startDate: objective.startDate.toISOString(),
    endDate: objective.endDate.toISOString(),
    progress: objective.progress,
    createdAt: objective.createdAt.toISOString(),
    updatedAt: objective.updatedAt.toISOString(),
  };
}
