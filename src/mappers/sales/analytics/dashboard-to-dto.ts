import type { AnalyticsDashboard } from '@/entities/sales/analytics-dashboard';

export interface AnalyticsDashboardDTO {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isSystem: boolean;
  role?: string;
  visibility: string;
  layout?: Record<string, unknown>;
  createdByUserId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function dashboardToDTO(
  dashboard: AnalyticsDashboard,
): AnalyticsDashboardDTO {
  return {
    id: dashboard.id.toString(),
    name: dashboard.name,
    description: dashboard.description,
    isDefault: dashboard.isDefault,
    isSystem: dashboard.isSystem,
    role: dashboard.role,
    visibility: dashboard.visibility,
    layout: dashboard.layout,
    createdByUserId: dashboard.createdByUserId,
    createdAt: dashboard.createdAt,
    updatedAt: dashboard.updatedAt,
  };
}
