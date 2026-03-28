import { PunchConfiguration } from '@/entities/hr/punch-configuration';
import type {
  PunchConfigRepository,
  UpdatePunchConfigData,
} from '../punch-config-repository';

export class InMemoryPunchConfigRepository implements PunchConfigRepository {
  public items: PunchConfiguration[] = [];

  async findByTenantId(tenantId: string): Promise<PunchConfiguration | null> {
    return this.items.find((config) => config.tenantId === tenantId) ?? null;
  }

  async create(tenantId: string): Promise<PunchConfiguration> {
    const config = PunchConfiguration.createDefault(tenantId);

    this.items.push(config);
    return config;
  }

  async update(
    tenantId: string,
    data: UpdatePunchConfigData,
  ): Promise<PunchConfiguration> {
    const index = this.items.findIndex(
      (config) => config.tenantId === tenantId,
    );

    if (index === -1) {
      throw new Error(`Punch config not found for tenant ${tenantId}`);
    }

    const existing = this.items[index];

    const updated = PunchConfiguration.create(
      {
        tenantId,
        selfieRequired: data.selfieRequired ?? existing.selfieRequired,
        gpsRequired: data.gpsRequired ?? existing.gpsRequired,
        geofenceEnabled: data.geofenceEnabled ?? existing.geofenceEnabled,
        qrCodeEnabled: data.qrCodeEnabled ?? existing.qrCodeEnabled,
        directLoginEnabled:
          data.directLoginEnabled ?? existing.directLoginEnabled,
        kioskModeEnabled: data.kioskModeEnabled ?? existing.kioskModeEnabled,
        pwaEnabled: data.pwaEnabled ?? existing.pwaEnabled,
        offlineAllowed: data.offlineAllowed ?? existing.offlineAllowed,
        maxOfflineHours: data.maxOfflineHours ?? existing.maxOfflineHours,
        toleranceMinutes: data.toleranceMinutes ?? existing.toleranceMinutes,
        autoClockOutHours:
          data.autoClockOutHours !== undefined
            ? data.autoClockOutHours
            : existing.autoClockOutHours,
        pdfReceiptEnabled: data.pdfReceiptEnabled ?? existing.pdfReceiptEnabled,
        defaultRadiusMeters:
          data.defaultRadiusMeters ?? existing.defaultRadiusMeters,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }
}
