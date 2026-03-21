import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsGoal } from '@/entities/sales/analytics-goal';

export interface CreateAnalyticsGoalSchema {
  tenantId: string;
  name: string;
  type: string;
  targetValue: number;
  currentValue?: number;
  unit?: string;
  period: string;
  startDate: Date;
  endDate: Date;
  scope: string;
  userId?: string;
  teamId?: string;
  status?: string;
  createdByUserId: string;
}

export interface UpdateAnalyticsGoalSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface AnalyticsGoalsRepository {
  create(data: CreateAnalyticsGoalSchema): Promise<AnalyticsGoal>;
  findById(id: UniqueEntityID, tenantId: string): Promise<AnalyticsGoal | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: {
      status?: string;
      type?: string;
      scope?: string;
      userId?: string;
    },
  ): Promise<AnalyticsGoal[]>;
  countMany(
    tenantId: string,
    filters?: {
      status?: string;
      type?: string;
      scope?: string;
      userId?: string;
    },
  ): Promise<number>;
  update(data: UpdateAnalyticsGoalSchema): Promise<AnalyticsGoal | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
