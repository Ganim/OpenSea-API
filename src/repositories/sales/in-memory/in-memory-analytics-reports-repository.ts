import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsReport } from '@/entities/sales/analytics-report';
import type {
  AnalyticsReportsRepository,
  CreateAnalyticsReportSchema,
  UpdateAnalyticsReportSchema,
} from '../analytics-reports-repository';

export class InMemoryAnalyticsReportsRepository implements AnalyticsReportsRepository {
  public items: AnalyticsReport[] = [];

  async create(data: CreateAnalyticsReportSchema): Promise<AnalyticsReport> {
    const report = AnalyticsReport.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      type: data.type,
      config: data.config,
      format: data.format,
      dashboardId: data.dashboardId,
      isScheduled: data.isScheduled,
      scheduleFrequency: data.scheduleFrequency,
      scheduleDayOfWeek: data.scheduleDayOfWeek,
      scheduleDayOfMonth: data.scheduleDayOfMonth,
      scheduleHour: data.scheduleHour,
      scheduleTimezone: data.scheduleTimezone,
      deliveryMethod: data.deliveryMethod,
      recipientUserIds: data.recipientUserIds,
      recipientEmails: data.recipientEmails,
      recipientPhones: data.recipientPhones,
      createdByUserId: data.createdByUserId,
    });

    this.items.push(report);
    return report;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<AnalyticsReport | null> {
    return (
      this.items.find(
        (r) => r.id.toString() === id.toString() && r.tenantId.toString() === tenantId && !r.deletedAt,
      ) ?? null
    );
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { type?: string; isScheduled?: boolean; isActive?: boolean },
  ): Promise<AnalyticsReport[]> {
    let filtered = this.items.filter((r) => r.tenantId.toString() === tenantId && !r.deletedAt);

    if (filters?.type) filtered = filtered.filter((r) => r.type === filters.type);
    if (filters?.isScheduled !== undefined) filtered = filtered.filter((r) => r.isScheduled === filters.isScheduled);
    if (filters?.isActive !== undefined) filtered = filtered.filter((r) => r.isActive === filters.isActive);

    const start = (page - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }

  async countMany(
    tenantId: string,
    filters?: { type?: string; isScheduled?: boolean; isActive?: boolean },
  ): Promise<number> {
    let filtered = this.items.filter((r) => r.tenantId.toString() === tenantId && !r.deletedAt);

    if (filters?.type) filtered = filtered.filter((r) => r.type === filters.type);
    if (filters?.isScheduled !== undefined) filtered = filtered.filter((r) => r.isScheduled === filters.isScheduled);
    if (filters?.isActive !== undefined) filtered = filtered.filter((r) => r.isActive === filters.isActive);

    return filtered.length;
  }

  async update(data: UpdateAnalyticsReportSchema): Promise<AnalyticsReport | null> {
    const report = this.items.find(
      (r) => r.id.toString() === data.id.toString() && r.tenantId.toString() === data.tenantId && !r.deletedAt,
    );

    if (!report) return null;

    if (data.name !== undefined) report.name = data.name;

    return report;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const report = this.items.find(
      (r) => r.id.toString() === id.toString() && r.tenantId.toString() === tenantId,
    );
    if (report) report.delete();
  }
}
