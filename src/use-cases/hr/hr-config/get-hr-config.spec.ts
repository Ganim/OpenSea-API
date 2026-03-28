import { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import { InMemoryHrTenantConfigRepository } from '@/repositories/hr/in-memory/in-memory-hr-tenant-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetHrConfigUseCase } from './get-hr-config';

const TENANT_ID = 'tenant-1';

let hrConfigRepository: InMemoryHrTenantConfigRepository;
let sut: GetHrConfigUseCase;

describe('Get HR Config Use Case', () => {
  beforeEach(() => {
    hrConfigRepository = new InMemoryHrTenantConfigRepository();
    sut = new GetHrConfigUseCase(hrConfigRepository);
  });

  it('should create default config when none exists for the tenant', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.hrConfig).toBeDefined();
    expect(result.hrConfig.tenantId).toBe(TENANT_ID);
    expect(result.hrConfig.empresaCidadaEnabled).toBe(false);
    expect(result.hrConfig.maternityLeaveDays).toBe(120);
    expect(result.hrConfig.paternityLeaveDays).toBe(5);
    expect(result.hrConfig.unionContributionEnabled).toBe(false);
    expect(result.hrConfig.unionContributionRate).toBeNull();
    expect(result.hrConfig.patEnabled).toBe(false);
    expect(result.hrConfig.patMonthlyValuePerEmployee).toBeNull();
    expect(result.hrConfig.timeBankIndividualMonths).toBe(6);
    expect(result.hrConfig.timeBankCollectiveMonths).toBe(12);
    expect(result.hrConfig.ratPercent).toBe(2);
    expect(result.hrConfig.fapFactor).toBe(1.0);
    expect(result.hrConfig.terceirosPercent).toBe(5.8);
  });

  it('should return existing config when one already exists', async () => {
    const existingConfig = HrTenantConfig.create({
      tenantId: TENANT_ID,
      empresaCidadaEnabled: true,
      maternityLeaveDays: 180,
      paternityLeaveDays: 20,
      unionContributionEnabled: true,
      unionContributionRate: 0.0333,
      patEnabled: true,
      patMonthlyValuePerEmployee: 150,
      timeBankIndividualMonths: 6,
      timeBankCollectiveMonths: 12,
      ratPercent: 3,
      fapFactor: 1.5,
      terceirosPercent: 5.8,
    });
    hrConfigRepository.items.push(existingConfig);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.hrConfig.empresaCidadaEnabled).toBe(true);
    expect(result.hrConfig.maternityLeaveDays).toBe(180);
    expect(result.hrConfig.paternityLeaveDays).toBe(20);
    expect(result.hrConfig.unionContributionEnabled).toBe(true);
    expect(result.hrConfig.unionContributionRate).toBe(0.0333);
    expect(result.hrConfig.patEnabled).toBe(true);
    expect(result.hrConfig.patMonthlyValuePerEmployee).toBe(150);
  });

  it('should persist the created default config in the repository', async () => {
    await sut.execute({ tenantId: TENANT_ID });

    expect(hrConfigRepository.items).toHaveLength(1);
    expect(hrConfigRepository.items[0].tenantId).toBe(TENANT_ID);
  });

  it('should not create duplicate configs for the same tenant', async () => {
    await sut.execute({ tenantId: TENANT_ID });
    await sut.execute({ tenantId: TENANT_ID });

    expect(hrConfigRepository.items).toHaveLength(1);
  });

  it('should return separate configs for different tenants', async () => {
    const resultTenant1 = await sut.execute({ tenantId: 'tenant-1' });
    const resultTenant2 = await sut.execute({ tenantId: 'tenant-2' });

    expect(resultTenant1.hrConfig.tenantId).toBe('tenant-1');
    expect(resultTenant2.hrConfig.tenantId).toBe('tenant-2');
    expect(hrConfigRepository.items).toHaveLength(2);
  });
});
