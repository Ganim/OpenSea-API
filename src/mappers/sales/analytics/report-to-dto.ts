import type { AnalyticsReport } from '@/entities/sales/analytics-report';

export interface AnalyticsReportDTO {
  id: string;
  name: string;
  type: string;
  config: Record<string, unknown>;
  format: string;
  dashboardId?: string;
  isScheduled: boolean;
  scheduleFrequency?: string;
  scheduleDayOfWeek?: number;
  scheduleDayOfMonth?: number;
  scheduleHour?: number;
  scheduleTimezone: string;
  deliveryMethod?: string;
  recipientUserIds: string[];
  recipientEmails: string[];
  recipientPhones: string[];
  lastGeneratedAt?: Date;
  lastStatus?: string;
  isActive: boolean;
  createdByUserId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function reportToDTO(report: AnalyticsReport): AnalyticsReportDTO {
  return {
    id: report.id.toString(),
    name: report.name,
    type: report.type,
    config: report.config,
    format: report.format,
    dashboardId: report.dashboardId,
    isScheduled: report.isScheduled,
    scheduleFrequency: report.scheduleFrequency,
    scheduleDayOfWeek: report.scheduleDayOfWeek,
    scheduleDayOfMonth: report.scheduleDayOfMonth,
    scheduleHour: report.scheduleHour,
    scheduleTimezone: report.scheduleTimezone,
    deliveryMethod: report.deliveryMethod,
    recipientUserIds: report.recipientUserIds,
    recipientEmails: report.recipientEmails,
    recipientPhones: report.recipientPhones,
    lastGeneratedAt: report.lastGeneratedAt,
    lastStatus: report.lastStatus,
    isActive: report.isActive,
    createdByUserId: report.createdByUserId,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
  };
}
