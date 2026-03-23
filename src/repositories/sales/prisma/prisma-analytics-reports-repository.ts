import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import { AnalyticsReport } from '@/entities/sales/analytics-report';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  AnalyticsReportsRepository,
  CreateAnalyticsReportSchema,
  UpdateAnalyticsReportSchema,
} from '../analytics-reports-repository';
import type {
  ReportType,
  ReportFormat,
  ReportFrequency,
  ReportDeliveryMethod,
} from '@prisma/generated/client.js';

function mapToDomain(data: Record<string, unknown>): AnalyticsReport {
  return AnalyticsReport.create(
    {
      tenantId: new EntityID(data.tenantId as string),
      name: data.name as string,
      type: data.type as string,
      config: (data.config as Record<string, unknown>) ?? {},
      format: data.format as string,
      dashboardId: (data.dashboardId as string) ?? undefined,
      isScheduled: data.isScheduled as boolean,
      scheduleFrequency: (data.scheduleFrequency as string) ?? undefined,
      scheduleDayOfWeek: (data.scheduleDayOfWeek as number) ?? undefined,
      scheduleDayOfMonth: (data.scheduleDayOfMonth as number) ?? undefined,
      scheduleHour: (data.scheduleHour as number) ?? undefined,
      scheduleTimezone: data.scheduleTimezone as string,
      deliveryMethod: (data.deliveryMethod as string) ?? undefined,
      recipientUserIds: (data.recipientUserIds as string[]) ?? [],
      recipientEmails: (data.recipientEmails as string[]) ?? [],
      recipientPhones: (data.recipientPhones as string[]) ?? [],
      lastGeneratedAt: (data.lastGeneratedAt as Date) ?? undefined,
      lastFileId: (data.lastFileId as string) ?? undefined,
      lastStatus: (data.lastStatus as string) ?? undefined,
      lastError: (data.lastError as string) ?? undefined,
      isActive: data.isActive as boolean,
      createdByUserId: data.createdByUserId as string,
      createdAt: data.createdAt as Date,
      updatedAt: data.updatedAt as Date,
      deletedAt: (data.deletedAt as Date) ?? undefined,
    },
    new EntityID(data.id as string),
  );
}

export class PrismaAnalyticsReportsRepository
  implements AnalyticsReportsRepository
{
  async create(data: CreateAnalyticsReportSchema): Promise<AnalyticsReport> {
    const report = await prisma.analyticsReport.create({
      data: {
        tenantId: data.tenantId,
        name: data.name,
        type: data.type as ReportType,
        config: (data.config ?? {}) as unknown as Prisma.InputJsonValue,
        format: data.format as ReportFormat,
        dashboardId: data.dashboardId,
        isScheduled: data.isScheduled ?? false,
        scheduleFrequency: data.scheduleFrequency as
          | ReportFrequency
          | undefined,
        scheduleDayOfWeek: data.scheduleDayOfWeek,
        scheduleDayOfMonth: data.scheduleDayOfMonth,
        scheduleHour: data.scheduleHour,
        scheduleTimezone: data.scheduleTimezone ?? 'America/Sao_Paulo',
        deliveryMethod: data.deliveryMethod as ReportDeliveryMethod | undefined,
        recipientUserIds: data.recipientUserIds ?? [],
        recipientEmails: data.recipientEmails ?? [],
        recipientPhones: data.recipientPhones ?? [],
        createdByUserId: data.createdByUserId,
      },
    });

    return mapToDomain(report as unknown as Record<string, unknown>);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<AnalyticsReport | null> {
    const report = await prisma.analyticsReport.findFirst({
      where: { id: id.toString(), tenantId, deletedAt: null },
    });

    return report
      ? mapToDomain(report as unknown as Record<string, unknown>)
      : null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    filters?: { type?: string; isScheduled?: boolean; isActive?: boolean },
  ): Promise<AnalyticsReport[]> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.type) where.type = filters.type;
    if (filters?.isScheduled !== undefined)
      where.isScheduled = filters.isScheduled;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    const reports = await prisma.analyticsReport.findMany({
      where,
      skip: (page - 1) * perPage,
      take: perPage,
      orderBy: { createdAt: 'desc' },
    });

    return reports.map((r) =>
      mapToDomain(r as unknown as Record<string, unknown>),
    );
  }

  async countMany(
    tenantId: string,
    filters?: { type?: string; isScheduled?: boolean; isActive?: boolean },
  ): Promise<number> {
    const where: Record<string, unknown> = { tenantId, deletedAt: null };

    if (filters?.type) where.type = filters.type;
    if (filters?.isScheduled !== undefined)
      where.isScheduled = filters.isScheduled;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    return prisma.analyticsReport.count({ where });
  }

  async update(
    data: UpdateAnalyticsReportSchema,
  ): Promise<AnalyticsReport | null> {
    const updateData: Record<string, unknown> = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.config !== undefined) updateData.config = data.config;
    if (data.format !== undefined) updateData.format = data.format;
    if (data.isScheduled !== undefined)
      updateData.isScheduled = data.isScheduled;
    if (data.scheduleFrequency !== undefined)
      updateData.scheduleFrequency = data.scheduleFrequency;
    if (data.scheduleDayOfWeek !== undefined)
      updateData.scheduleDayOfWeek = data.scheduleDayOfWeek;
    if (data.scheduleDayOfMonth !== undefined)
      updateData.scheduleDayOfMonth = data.scheduleDayOfMonth;
    if (data.scheduleHour !== undefined)
      updateData.scheduleHour = data.scheduleHour;
    if (data.scheduleTimezone !== undefined)
      updateData.scheduleTimezone = data.scheduleTimezone;
    if (data.deliveryMethod !== undefined)
      updateData.deliveryMethod = data.deliveryMethod;
    if (data.recipientUserIds !== undefined)
      updateData.recipientUserIds = data.recipientUserIds;
    if (data.recipientEmails !== undefined)
      updateData.recipientEmails = data.recipientEmails;
    if (data.recipientPhones !== undefined)
      updateData.recipientPhones = data.recipientPhones;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const report = await prisma.analyticsReport.update({
      where: { id: data.id.toString() },
      data: updateData,
    });

    return mapToDomain(report as unknown as Record<string, unknown>);
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    await prisma.analyticsReport.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date(), isActive: false },
    });
  }
}
