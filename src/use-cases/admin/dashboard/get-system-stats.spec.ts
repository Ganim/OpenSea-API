import { InMemoryPlansRepository } from '@/repositories/core/in-memory/in-memory-plans-repository';
import { InMemoryTenantsRepository } from '@/repositories/core/in-memory/in-memory-tenants-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetSystemStatsUseCase } from './get-system-stats';

let tenantsRepository: InMemoryTenantsRepository;
let plansRepository: InMemoryPlansRepository;
let sut: GetSystemStatsUseCase;

describe('GetSystemStatsUseCase', () => {
  beforeEach(() => {
    tenantsRepository = new InMemoryTenantsRepository();
    plansRepository = new InMemoryPlansRepository();
    sut = new GetSystemStatsUseCase(tenantsRepository, plansRepository);
  });

  // OBJECTIVE
  it('should return system statistics', async () => {
    await tenantsRepository.create({ name: 'Tenant 1', slug: 'tenant-1' });
    await tenantsRepository.create({ name: 'Tenant 2', slug: 'tenant-2' });

    await plansRepository.create({ name: 'Free', isActive: true });
    await plansRepository.create({ name: 'Starter', isActive: true });
    await plansRepository.create({ name: 'Inactive', isActive: false });

    const { totalTenants, totalPlans, activePlans } = await sut.execute();

    expect(totalTenants).toBe(2);
    expect(totalPlans).toBe(3);
    expect(activePlans).toBe(2);
  });

  it('should return zeros when no data exists', async () => {
    const { totalTenants, totalPlans, activePlans } = await sut.execute();

    expect(totalTenants).toBe(0);
    expect(totalPlans).toBe(0);
    expect(activePlans).toBe(0);
  });

  // VALIDATIONS
  it('should count only active plans correctly', async () => {
    await plansRepository.create({ name: 'Active 1', isActive: true });
    await plansRepository.create({ name: 'Active 2', isActive: true });
    await plansRepository.create({ name: 'Active 3', isActive: true });
    await plansRepository.create({ name: 'Inactive 1', isActive: false });
    await plansRepository.create({ name: 'Inactive 2', isActive: false });

    const { totalPlans, activePlans } = await sut.execute();

    expect(totalPlans).toBe(5);
    expect(activePlans).toBe(3);
  });
});
