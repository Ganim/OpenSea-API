import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsDashboard } from '@/entities/sales/analytics-dashboard';

export interface CreateAnalyticsDashboardSchema {
  tenantId: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  isSystem?: boolean;
  role?: string;
  visibility?: string;
  layout?: Record<string, unknown>;
  createdByUserId: string;
}

export interface AnalyticsDashboardsRepository {
  create(data: CreateAnalyticsDashboardSchema): Promise<AnalyticsDashboard>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<AnalyticsDashboard | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: {
      role?: string;
      visibility?: string;
    },
  ): Promise<AnalyticsDashboard[]>;
  countMany(
    tenantId: string,
    filters?: {
      role?: string;
      visibility?: string;
    },
  ): Promise<number>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
