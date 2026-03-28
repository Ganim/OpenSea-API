import { HrTenantConfig } from '@/entities/hr/hr-tenant-config';
import { InMemoryHrTenantConfigRepository } from '@/repositories/hr/in-memory/in-memory-hr-tenant-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateHrConfigUseCase } from './update-hr-config';

const TENANT_ID = 'tenant-1';

let hrConfigRepository: InMemoryHrTenantConfigRepository;
let sut: UpdateHrConfigUseCase;

describe('Update HR Config Use Case', () => {
  beforeEach(() => {
    hrConfigRepository = new InMemoryHrTenantConfigRepository();
    sut = new UpdateHrConfigUseCase(hrConfigRepository);
  });

  it('should create default config and then update when none exists', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        empresaCidadaEnabled: true,
        maternityLeaveDays: 180,
      },
    });

    expect(result.hrConfig.empresaCidadaEnabled).toBe(true);
    expect(result.hrConfig.maternityLeaveDays).toBe(180);
    // Other fields should retain default values
    expect(result.hrConfig.paternityLeaveDays).toBe(5);
  });

  it('should update existing config fields partially', async () => {
    const existingConfig = HrTenantConfig.create({
      tenantId: TENANT_ID,
      empresaCidadaEnabled: false,
      maternityLeaveDays: 120,
      paternityLeaveDays: 5,
      unionContributionEnabled: false,
      unionContributionRate: null,
      patEnabled: false,
      patMonthlyValuePerEmployee: null,
      timeBankIndividualMonths: 6,
      timeBankCollectiveMonths: 12,
      ratPercent: 2,
      fapFactor: 1.0,
      terceirosPercent: 5.8,
    });
    hrConfigRepository.items.push(existingConfig);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        unionContributionEnabled: true,
        unionContributionRate: 0.0333,
      },
    });

    expect(result.hrConfig.unionContributionEnabled).toBe(true);
    expect(result.hrConfig.unionContributionRate).toBe(0.0333);
    // Unchanged fields remain the same
    expect(result.hrConfig.empresaCidadaEnabled).toBe(false);
    expect(result.hrConfig.maternityLeaveDays).toBe(120);
  });

  it('should update Empresa Cidada settings with extended leave days', async () => {
    await hrConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        empresaCidadaEnabled: true,
        maternityLeaveDays: 180,
        paternityLeaveDays: 20,
      },
    });

    expect(result.hrConfig.empresaCidadaEnabled).toBe(true);
    expect(result.hrConfig.maternityLeaveDays).toBe(180);
    expect(result.hrConfig.paternityLeaveDays).toBe(20);
  });

  it('should update PAT program settings', async () => {
    await hrConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        patEnabled: true,
        patMonthlyValuePerEmployee: 200,
      },
    });

    expect(result.hrConfig.patEnabled).toBe(true);
    expect(result.hrConfig.patMonthlyValuePerEmployee).toBe(200);
  });

  it('should update GPS contribution settings', async () => {
    await hrConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        ratPercent: 3,
        fapFactor: 1.8,
        terceirosPercent: 6.0,
      },
    });

    expect(result.hrConfig.ratPercent).toBe(3);
    expect(result.hrConfig.fapFactor).toBe(1.8);
    expect(result.hrConfig.terceirosPercent).toBe(6.0);
  });

  it('should update time bank settings', async () => {
    await hrConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        timeBankIndividualMonths: 3,
        timeBankCollectiveMonths: 6,
      },
    });

    expect(result.hrConfig.timeBankIndividualMonths).toBe(3);
    expect(result.hrConfig.timeBankCollectiveMonths).toBe(6);
  });

  it('should allow setting nullable fields to null', async () => {
    const existingConfig = HrTenantConfig.create({
      tenantId: TENANT_ID,
      empresaCidadaEnabled: false,
      maternityLeaveDays: 120,
      paternityLeaveDays: 5,
      unionContributionEnabled: true,
      unionContributionRate: 0.0333,
      patEnabled: true,
      patMonthlyValuePerEmployee: 200,
      timeBankIndividualMonths: 6,
      timeBankCollectiveMonths: 12,
      ratPercent: 2,
      fapFactor: 1.0,
      terceirosPercent: 5.8,
    });
    hrConfigRepository.items.push(existingConfig);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        unionContributionRate: null,
        patMonthlyValuePerEmployee: null,
      },
    });

    expect(result.hrConfig.unionContributionRate).toBeNull();
    expect(result.hrConfig.patMonthlyValuePerEmployee).toBeNull();
  });

  it('should update config for the correct tenant only', async () => {
    await hrConfigRepository.create('tenant-1');
    await hrConfigRepository.create('tenant-2');

    await sut.execute({
      tenantId: 'tenant-1',
      data: { empresaCidadaEnabled: true },
    });

    const tenant1Config = hrConfigRepository.items.find(
      (c) => c.tenantId === 'tenant-1',
    );
    const tenant2Config = hrConfigRepository.items.find(
      (c) => c.tenantId === 'tenant-2',
    );

    expect(tenant1Config!.empresaCidadaEnabled).toBe(true);
    expect(tenant2Config!.empresaCidadaEnabled).toBe(false);
  });
});
