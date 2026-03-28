import { PunchConfiguration } from '@/entities/hr/punch-configuration';
import { InMemoryPunchConfigRepository } from '@/repositories/hr/in-memory/in-memory-punch-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPunchConfigUseCase } from './get-punch-config';

const TENANT_ID = 'tenant-1';

let punchConfigRepository: InMemoryPunchConfigRepository;
let sut: GetPunchConfigUseCase;

describe('Get Punch Config Use Case', () => {
  beforeEach(() => {
    punchConfigRepository = new InMemoryPunchConfigRepository();
    sut = new GetPunchConfigUseCase(punchConfigRepository);
  });

  it('should create default config when none exists for the tenant', async () => {
    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.punchConfig).toBeDefined();
    expect(result.punchConfig.tenantId).toBe(TENANT_ID);
    // Verify default values match PunchConfiguration.createDefault
    expect(result.punchConfig.selfieRequired).toBe(true);
    expect(result.punchConfig.gpsRequired).toBe(true);
    expect(result.punchConfig.geofenceEnabled).toBe(false);
    expect(result.punchConfig.qrCodeEnabled).toBe(true);
    expect(result.punchConfig.directLoginEnabled).toBe(true);
    expect(result.punchConfig.kioskModeEnabled).toBe(false);
    expect(result.punchConfig.pwaEnabled).toBe(true);
    expect(result.punchConfig.offlineAllowed).toBe(false);
    expect(result.punchConfig.maxOfflineHours).toBe(24);
    expect(result.punchConfig.toleranceMinutes).toBe(10);
    expect(result.punchConfig.autoClockOutHours).toBeNull();
    expect(result.punchConfig.pdfReceiptEnabled).toBe(true);
    expect(result.punchConfig.defaultRadiusMeters).toBe(200);
  });

  it('should return existing config when one already exists', async () => {
    const existingConfig = PunchConfiguration.create({
      tenantId: TENANT_ID,
      selfieRequired: false,
      gpsRequired: false,
      geofenceEnabled: true,
      qrCodeEnabled: false,
      directLoginEnabled: false,
      kioskModeEnabled: true,
      pwaEnabled: false,
      offlineAllowed: true,
      maxOfflineHours: 48,
      toleranceMinutes: 15,
      autoClockOutHours: 10,
      pdfReceiptEnabled: false,
      defaultRadiusMeters: 500,
    });
    punchConfigRepository.items.push(existingConfig);

    const result = await sut.execute({ tenantId: TENANT_ID });

    expect(result.punchConfig.selfieRequired).toBe(false);
    expect(result.punchConfig.geofenceEnabled).toBe(true);
    expect(result.punchConfig.kioskModeEnabled).toBe(true);
    expect(result.punchConfig.maxOfflineHours).toBe(48);
    expect(result.punchConfig.toleranceMinutes).toBe(15);
    expect(result.punchConfig.autoClockOutHours).toBe(10);
    expect(result.punchConfig.defaultRadiusMeters).toBe(500);
  });

  it('should persist the created default config in the repository', async () => {
    await sut.execute({ tenantId: TENANT_ID });

    expect(punchConfigRepository.items).toHaveLength(1);
    expect(punchConfigRepository.items[0].tenantId).toBe(TENANT_ID);
  });

  it('should not create duplicate configs for the same tenant', async () => {
    await sut.execute({ tenantId: TENANT_ID });
    await sut.execute({ tenantId: TENANT_ID });

    expect(punchConfigRepository.items).toHaveLength(1);
  });

  it('should return separate configs for different tenants', async () => {
    const resultTenant1 = await sut.execute({ tenantId: 'tenant-1' });
    const resultTenant2 = await sut.execute({ tenantId: 'tenant-2' });

    expect(resultTenant1.punchConfig.tenantId).toBe('tenant-1');
    expect(resultTenant2.punchConfig.tenantId).toBe('tenant-2');
    expect(punchConfigRepository.items).toHaveLength(2);
  });
});
