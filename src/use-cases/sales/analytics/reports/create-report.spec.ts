import { InMemoryAnalyticsReportsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-reports-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateReportUseCase } from './create-report';

let reportsRepository: InMemoryAnalyticsReportsRepository;
let sut: CreateReportUseCase;

describe('CreateReportUseCase', () => {
  beforeEach(() => {
    reportsRepository = new InMemoryAnalyticsReportsRepository();
    sut = new CreateReportUseCase(reportsRepository);
  });

  it('should create a report', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Sales Summary',
      type: 'SALES_SUMMARY',
      format: 'PDF',
      createdByUserId: 'user-1',
    });

    expect(result.report).toBeTruthy();
    expect(result.report.name).toBe('Sales Summary');
    expect(result.report.type).toBe('SALES_SUMMARY');
    expect(result.report.format).toBe('PDF');
    expect(reportsRepository.items).toHaveLength(1);
  });

  it('should throw if name is empty', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '',
        type: 'SALES_SUMMARY',
        format: 'PDF',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Report name is required.');
  });

  it('should throw if name exceeds 128 characters', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'A'.repeat(129),
        type: 'SALES_SUMMARY',
        format: 'PDF',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Report name cannot exceed 128 characters.');
  });

  it('should throw for invalid report type', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test Report',
        type: 'INVALID_TYPE',
        format: 'PDF',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Invalid report type');
  });

  it('should throw for invalid format', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test Report',
        type: 'SALES_SUMMARY',
        format: 'INVALID',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Invalid report format');
  });

  it('should require schedule frequency for scheduled reports', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Scheduled Report',
        type: 'SALES_SUMMARY',
        format: 'PDF',
        isScheduled: true,
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Schedule frequency is required');
  });

  it('should require valid schedule hour for scheduled reports', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Scheduled Report',
        type: 'SALES_SUMMARY',
        format: 'PDF',
        isScheduled: true,
        scheduleFrequency: 'DAILY',
        scheduleHour: 25,
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Schedule hour must be between 0 and 23.');
  });

  it('should create a scheduled report with valid params', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Daily Report',
      type: 'PIPELINE_REPORT',
      format: 'EXCEL',
      isScheduled: true,
      scheduleFrequency: 'DAILY',
      scheduleHour: 8,
      createdByUserId: 'user-1',
    });

    expect(result.report.isScheduled).toBe(true);
    expect(result.report.scheduleFrequency).toBe('DAILY');
    expect(result.report.scheduleHour).toBe(8);
  });

  it('should trim the name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: '  Trimmed Report  ',
      type: 'SALES_SUMMARY',
      format: 'CSV',
      createdByUserId: 'user-1',
    });

    expect(result.report.name).toBe('Trimmed Report');
  });
});
