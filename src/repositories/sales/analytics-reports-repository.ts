import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsReport } from '@/entities/sales/analytics-report';

export interface CreateAnalyticsReportSchema {
  tenantId: string;
  name: string;
  type: string;
  config?: Record<string, unknown>;
  format: string;
  dashboardId?: string;
  isScheduled?: boolean;
  scheduleFrequency?: string;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  scheduleTimezone?: string;
  deliveryMethod?: string;
  recipientUserIds?: string[];
  recipientEmails?: string[];
  recipientPhones?: string[];
  createdByUserId: string;
}

export interface UpdateAnalyticsReportSchema {
  id: UniqueEntityID;
  tenantId: string;
  name?: string;
  config?: Record<string, unknown>;
  format?: string;
  isScheduled?: boolean;
  scheduleFrequency?: string;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  scheduleTimezone?: string;
  deliveryMethod?: string;
  recipientUserIds?: string[];
  recipientEmails?: string[];
  recipientPhones?: string[];
  isActive?: boolean;
}

export interface AnalyticsReportsRepository {
  create(data: CreateAnalyticsReportSchema): Promise<AnalyticsReport>;
  findById(id: UniqueEntityID, tenantId: string): Promise<AnalyticsReport | null>;
  findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: {
      type?: string;
      isScheduled?: boolean;
      isActive?: boolean;
    },
  ): Promise<AnalyticsReport[]>;
  countMany(
    tenantId: string,
    filters?: {
      type?: string;
      isScheduled?: boolean;
      isActive?: boolean;
    },
  ): Promise<number>;
  update(data: UpdateAnalyticsReportSchema): Promise<AnalyticsReport | null>;
  delete(id: UniqueEntityID, tenantId: string): Promise<void>;
}
