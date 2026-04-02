import { InMemoryAnalyticsDashboardsRepository } from '@/repositories/sales/in-memory/in-memory-analytics-dashboards-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateDashboardUseCase } from './create-dashboard';

let dashboardsRepository: InMemoryAnalyticsDashboardsRepository;
let sut: CreateDashboardUseCase;

describe('CreateDashboardUseCase', () => {
  beforeEach(() => {
    dashboardsRepository = new InMemoryAnalyticsDashboardsRepository();
    sut = new CreateDashboardUseCase(dashboardsRepository);
  });

  it('should create a dashboard', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Sales Overview',
      createdByUserId: 'user-1',
    });

    expect(result.dashboard).toBeTruthy();
    expect(result.dashboard.name).toBe('Sales Overview');
    expect(dashboardsRepository.items).toHaveLength(1);
  });

  it('should throw if name is empty', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Dashboard name is required.');
  });

  it('should throw if name is whitespace only', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '   ',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Dashboard name is required.');
  });

  it('should throw if name exceeds 128 characters', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'A'.repeat(129),
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Dashboard name cannot exceed 128 characters.');
  });

  it('should throw for invalid role', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test Dashboard',
        role: 'INVALID_ROLE',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Invalid dashboard role');
  });

  it('should throw for invalid visibility', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'Test Dashboard',
        visibility: 'INVALID',
        createdByUserId: 'user-1',
      }),
    ).rejects.toThrow('Invalid visibility');
  });

  it('should accept valid role and visibility', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Manager Dashboard',
      role: 'MANAGER',
      visibility: 'TEAM',
      createdByUserId: 'user-1',
    });

    expect(result.dashboard.role).toBe('MANAGER');
    expect(result.dashboard.visibility).toBe('TEAM');
  });

  it('should trim the name', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: '  Trimmed Name  ',
      createdByUserId: 'user-1',
    });

    expect(result.dashboard.name).toBe('Trimmed Name');
  });
});
