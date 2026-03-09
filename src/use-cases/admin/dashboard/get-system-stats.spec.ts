import { InMemoryAuditLogsRepository } from '@/repositories/audit/in-memory/in-memory-audit-logs-repository';
import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSystemStatsUseCase } from './get-system-stats';

let tenantsRepository: InMemoryTenantsRepository;
let plansRepository: InMemoryPlansRepository;
let auditLogsRepository: InMemoryAuditLogsRepository;
let sut: GetSystemStatsUseCase;

describe('GetSystemStatsUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    plansRepository = new InMemoryPlansRepository();
    auditLogsRepository = new InMemoryAuditLogsRepository();
    sut = new GetSystemStatsUseCase(
      tenantsRepository,
      plansRepository,
      auditLogsRepository,
    );
  });

  // OBJECTIVE
  it('should return system statistics', async () => {
    await tenantsRepository.create({ name: 'Tenant 1', slug: 'tenant-1' });
    await tenantsRepository.create({ name: 'Tenant 2', slug: 'tenant-2' });

    await plansRepository.create({ name: 'Free', isActive: true });
    await plansRepository.create({ name: 'Starter', isActive: true });
    await plansRepository.create({ name: 'Inactive', isActive: false });

    const result = await sut.execute();

    expect(result.totalTenants).toBe(2);
    expect(result.totalPlans).toBe(3);
    expect(result.activePlans).toBe(2);
  });

  it('should return zeros when no data exists', async () => {
    const result = await sut.execute();

    expect(result.totalTenants).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.activePlans).toBe(0);
  });

  // VALIDATIONS
  it('should count only active plans correctly', async () => {
    await plansRepository.create({ name: 'Active 1', isActive: true });
    await plansRepository.create({ name: 'Active 2', isActive: true });
    await plansRepository.create({ name: 'Active 3', isActive: true });
    await plansRepository.create({ name: 'Inactive 1', isActive: false });
    await plansRepository.create({ name: 'Inactive 2', isActive: false });

    const result = await sut.execute();

    expect(result.totalPlans).toBe(5);
    expect(result.activePlans).toBe(3);
  });

  it('should return tenants grouped by status', async () => {
    await tenantsRepository.create({
      name: 'Active 1',
      slug: 'active-1',
      status: 'ACTIVE',
    });
    await tenantsRepository.create({
      name: 'Active 2',
      slug: 'active-2',
      status: 'ACTIVE',
    });
    await tenantsRepository.create({
      name: 'Suspended',
      slug: 'suspended',
      status: 'SUSPENDED',
    });

    const result = await sut.execute();

    expect(result.tenantsByStatus).toEqual({
      ACTIVE: 2,
      SUSPENDED: 1,
    });
  });

  it('should return expanded response shape', async () => {
    const result = await sut.execute();

    expect(result).toHaveProperty('totalTenants');
    expect(result).toHaveProperty('totalPlans');
    expect(result).toHaveProperty('activePlans');
    expect(result).toHaveProperty('tenantsByStatus');
    expect(result).toHaveProperty('tenantsByTier');
    expect(result).toHaveProperty('monthlyGrowth');
    expect(result).toHaveProperty('recentActivity');
    expect(result).toHaveProperty('totalUsers');
    expect(result).toHaveProperty('mrr');
    expect(Array.isArray(result.monthlyGrowth)).toBe(true);
    expect(Array.isArray(result.recentActivity)).toBe(true);
  });
});
