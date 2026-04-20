import type { PunchConfiguration } from '@/entities/hr/punch-configuration';

export interface UpdatePunchConfigData {
  selfieRequired?: boolean;
  gpsRequired?: boolean;
  geofenceEnabled?: boolean;
  qrCodeEnabled?: boolean;
  directLoginEnabled?: boolean;
  kioskModeEnabled?: boolean;
  pwaEnabled?: boolean;
  offlineAllowed?: boolean;
  maxOfflineHours?: number;
  toleranceMinutes?: number;
  autoClockOutHours?: number | null;
  pdfReceiptEnabled?: boolean;
  defaultRadiusMeters?: number;
  faceMatchThreshold?: number;
}

export interface PunchConfigRepository {
  findByTenantId(tenantId: string): Promise<PunchConfiguration | null>;
  create(tenantId: string): Promise<PunchConfiguration>;
  update(
    tenantId: string,
    data: UpdatePunchConfigData,
  ): Promise<PunchConfiguration>;
}
