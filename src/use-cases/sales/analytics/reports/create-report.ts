import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { AnalyticsReportDTO } from '@/mappers/sales/analytics/report-to-dto';
import { reportToDTO } from '@/mappers/sales/analytics/report-to-dto';
import { AnalyticsReportsRepository } from '@/repositories/sales/analytics-reports-repository';

interface CreateReportUseCaseRequest {
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

interface CreateReportUseCaseResponse {
  report: AnalyticsReportDTO;
}

const VALID_TYPES = [
  'SALES_SUMMARY', 'COMMISSION_REPORT', 'PIPELINE_REPORT', 'PRODUCT_PERFORMANCE',
  'CUSTOMER_ANALYSIS', 'BID_REPORT', 'MARKETPLACE_REPORT', 'CASHIER_REPORT',
  'GOAL_PROGRESS', 'CURVA_ABC', 'CUSTOM',
];

const VALID_FORMATS = ['PDF', 'EXCEL', 'CSV'];

export class CreateReportUseCase {
  constructor(private reportsRepository: AnalyticsReportsRepository) {}

  async execute(input: CreateReportUseCaseRequest): Promise<CreateReportUseCaseResponse> {
    if (!input.name || input.name.trim().length === 0) {
      throw new BadRequestError('Report name is required.');
    }

    if (input.name.length > 128) {
      throw new BadRequestError('Report name cannot exceed 128 characters.');
    }

    if (!VALID_TYPES.includes(input.type)) {
      throw new BadRequestError(`Invalid report type: ${input.type}`);
    }

    if (!VALID_FORMATS.includes(input.format)) {
      throw new BadRequestError(`Invalid report format: ${input.format}`);
    }

    if (input.isScheduled) {
      if (!input.scheduleFrequency) {
        throw new BadRequestError('Schedule frequency is required for scheduled reports.');
      }
      if (input.scheduleHour === undefined || input.scheduleHour < 0 || input.scheduleHour > 23) {
        throw new BadRequestError('Schedule hour must be between 0 and 23.');
      }
    }

    const report = await this.reportsRepository.create({
      tenantId: input.tenantId,
      name: input.name.trim(),
      type: input.type,
      config: input.config,
      format: input.format,
      dashboardId: input.dashboardId,
      isScheduled: input.isScheduled,
      scheduleFrequency: input.scheduleFrequency,
      scheduleDayOfWeek: input.scheduleDayOfWeek,
      scheduleDayOfMonth: input.scheduleDayOfMonth,
      scheduleHour: input.scheduleHour,
      scheduleTimezone: input.scheduleTimezone,
      deliveryMethod: input.deliveryMethod,
      recipientUserIds: input.recipientUserIds,
      recipientEmails: input.recipientEmails,
      recipientPhones: input.recipientPhones,
      createdByUserId: input.createdByUserId,
    });

    return { report: reportToDTO(report) };
  }
}
