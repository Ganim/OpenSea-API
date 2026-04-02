import { InMemoryAnalyticsReportsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-reports-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListReportsUseCase } from './list-reports';

let reportsRepository: InMemoryAnalyticsReportsRepository;
let sut: ListReportsUseCase;

describe('ListReportsUseCase', () => {
  beforeEach(() => {
    reportsRepository = new InMemoryAnalyticsReportsRepository();
    sut = new ListReportsUseCase(reportsRepository);
  });

  it('should list reports with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await reportsRepository.create({
        tenantId: 'tenant-1',
        name: `Report ${i}`,
        type: 'SALES_SUMMARY',
        format: 'PDF',
        createdByUserId: 'user-1',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.reports).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no reports exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.reports).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should use default pagination', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it('should filter by type', async () => {
    await reportsRepository.create({
      tenantId: 'tenant-1',
      name: 'Sales Report',
      type: 'SALES_SUMMARY',
      format: 'PDF',
      createdByUserId: 'user-1',
    });
    await reportsRepository.create({
      tenantId: 'tenant-1',
      name: 'Pipeline Report',
      type: 'PIPELINE_REPORT',
      format: 'PDF',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      type: 'SALES_SUMMARY',
    });

    expect(result.reports).toHaveLength(1);
    expect(result.reports[0].type).toBe('SALES_SUMMARY');
  });
});
