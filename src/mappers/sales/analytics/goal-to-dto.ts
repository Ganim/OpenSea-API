import type { AnalyticsGoal } from '@/entities/sales/analytics-goal';

export interface AnalyticsGoalDTO {
  id: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  period: string;
  startDate: Date;
  endDate: Date;
  scope: string;
  userId?: string;
  teamId?: string;
  status: string;
  achievedAt?: Date;
  progressPercentage: number;
  createdByUserId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function goalToDTO(goal: AnalyticsGoal): AnalyticsGoalDTO {
  return {
    id: goal.id.toString(),
    name: goal.name,
    type: goal.type,
    targetValue: goal.targetValue,
    currentValue: goal.currentValue,
    unit: goal.unit,
    period: goal.period,
    startDate: goal.startDate,
    endDate: goal.endDate,
    scope: goal.scope,
    userId: goal.userId,
    teamId: goal.teamId,
    status: goal.status,
    achievedAt: goal.achievedAt,
    progressPercentage: goal.progressPercentage,
    createdByUserId: goal.createdByUserId,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}
