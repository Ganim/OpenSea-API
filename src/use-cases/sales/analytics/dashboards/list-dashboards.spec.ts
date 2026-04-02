import { InMemoryAnalyticsDashboardsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-dashboards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListDashboardsUseCase } from './list-dashboards';

let dashboardsRepository: InMemoryAnalyticsDashboardsRepository;
let sut: ListDashboardsUseCase;

describe('ListDashboardsUseCase', () => {
  beforeEach(() => {
    dashboardsRepository = new InMemoryAnalyticsDashboardsRepository();
    sut = new ListDashboardsUseCase(dashboardsRepository);
  });

  it('should list dashboards with pagination', async () => {
    for (let i = 0; i < 5; i++) {
      await dashboardsRepository.create({
        tenantId: 'tenant-1',
        name: `Dashboard ${i}`,
        createdByUserId: 'user-1',
      });
    }

    const result = await sut.execute({
      tenantId: 'tenant-1',
      page: 1,
      perPage: 3,
    });

    expect(result.dashboards).toHaveLength(3);
    expect(result.total).toBe(5);
    expect(result.totalPages).toBe(2);
  });

  it('should return empty list when no dashboards exist', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.dashboards).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should use default pagination when not specified', async () => {
    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.page).toBe(1);
    expect(result.perPage).toBe(20);
  });

  it('should filter by role', async () => {
    await dashboardsRepository.create({
      tenantId: 'tenant-1',
      name: 'Seller Dashboard',
      role: 'SELLER',
      createdByUserId: 'user-1',
    });
    await dashboardsRepository.create({
      tenantId: 'tenant-1',
      name: 'Manager Dashboard',
      role: 'MANAGER',
      createdByUserId: 'user-1',
    });

    const result = await sut.execute({
      tenantId: 'tenant-1',
      role: 'SELLER',
    });

    expect(result.dashboards).toHaveLength(1);
    expect(result.dashboards[0].name).toBe('Seller Dashboard');
  });
});
