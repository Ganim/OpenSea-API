import { InMemoryPunchConfigRepository } from '@/repositories/hr/in-memory/in-memory-punch-config-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdatePunchConfigUseCase } from './update-punch-config';

const TENANT_ID = 'tenant-1';

let punchConfigRepository: InMemoryPunchConfigRepository;
let sut: UpdatePunchConfigUseCase;

describe('Update Punch Config Use Case', () => {
  beforeEach(() => {
    punchConfigRepository = new InMemoryPunchConfigRepository();
    sut = new UpdatePunchConfigUseCase(punchConfigRepository);
  });

  it('should create default config and then update when none exists', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        selfieRequired: false,
        toleranceMinutes: 15,
      },
    });

    expect(result.punchConfig.selfieRequired).toBe(false);
    expect(result.punchConfig.toleranceMinutes).toBe(15);
    // Other fields retain default values
    expect(result.punchConfig.gpsRequired).toBe(true);
    expect(result.punchConfig.qrCodeEnabled).toBe(true);
  });

  it('should update existing config fields partially', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        geofenceEnabled: true,
        defaultRadiusMeters: 500,
      },
    });

    expect(result.punchConfig.geofenceEnabled).toBe(true);
    expect(result.punchConfig.defaultRadiusMeters).toBe(500);
    // Unchanged fields remain at defaults
    expect(result.punchConfig.selfieRequired).toBe(true);
    expect(result.punchConfig.gpsRequired).toBe(true);
  });

  it('should toggle geofence settings', async () => {
    await punchConfigRepository.create(TENANT_ID);

    // Enable geofence
    const enableResult = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        geofenceEnabled: true,
        defaultRadiusMeters: 300,
      },
    });
    expect(enableResult.punchConfig.geofenceEnabled).toBe(true);
    expect(enableResult.punchConfig.defaultRadiusMeters).toBe(300);

    // Disable geofence
    const disableResult = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        geofenceEnabled: false,
      },
    });
    expect(disableResult.punchConfig.geofenceEnabled).toBe(false);
    // Radius remains from previous update
    expect(disableResult.punchConfig.defaultRadiusMeters).toBe(300);
  });

  it('should update grace period (tolerance minutes)', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: { toleranceMinutes: 5 },
    });

    expect(result.punchConfig.toleranceMinutes).toBe(5);
  });

  it('should enable auto clock out', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: { autoClockOutHours: 12 },
    });

    expect(result.punchConfig.autoClockOutHours).toBe(12);
  });

  it('should disable auto clock out by setting to null', async () => {
    await punchConfigRepository.create(TENANT_ID);

    // First enable it
    await sut.execute({
      tenantId: TENANT_ID,
      data: { autoClockOutHours: 10 },
    });

    // Then disable it
    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: { autoClockOutHours: null },
    });

    expect(result.punchConfig.autoClockOutHours).toBeNull();
  });

  it('should update authentication method settings', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        selfieRequired: false,
        gpsRequired: false,
        qrCodeEnabled: false,
      },
    });

    expect(result.punchConfig.selfieRequired).toBe(false);
    expect(result.punchConfig.gpsRequired).toBe(false);
    expect(result.punchConfig.qrCodeEnabled).toBe(false);
  });

  it('should update access method settings', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        directLoginEnabled: false,
        kioskModeEnabled: true,
        pwaEnabled: false,
      },
    });

    expect(result.punchConfig.directLoginEnabled).toBe(false);
    expect(result.punchConfig.kioskModeEnabled).toBe(true);
    expect(result.punchConfig.pwaEnabled).toBe(false);
  });

  it('should update offline settings', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: {
        offlineAllowed: true,
        maxOfflineHours: 48,
      },
    });

    expect(result.punchConfig.offlineAllowed).toBe(true);
    expect(result.punchConfig.maxOfflineHours).toBe(48);
  });

  it('should update PDF receipt setting', async () => {
    await punchConfigRepository.create(TENANT_ID);

    const result = await sut.execute({
      tenantId: TENANT_ID,
      data: { pdfReceiptEnabled: false },
    });

    expect(result.punchConfig.pdfReceiptEnabled).toBe(false);
  });

  it('should update config for the correct tenant only', async () => {
    await punchConfigRepository.create('tenant-1');
    await punchConfigRepository.create('tenant-2');

    await sut.execute({
      tenantId: 'tenant-1',
      data: { toleranceMinutes: 30 },
    });

    const tenant1Config = punchConfigRepository.items.find(
      (c) => c.tenantId === 'tenant-1',
    );
    const tenant2Config = punchConfigRepository.items.find(
      (c) => c.tenantId === 'tenant-2',
    );

    expect(tenant1Config!.toleranceMinutes).toBe(30);
    expect(tenant2Config!.toleranceMinutes).toBe(10); // default
  });
});
