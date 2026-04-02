import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PunchConfiguration } from '@/entities/hr/punch-configuration';
import { prisma } from '@/lib/prisma';
import type {
  PunchConfigRepository,
  UpdatePunchConfigData,
} from '../punch-config-repository';

function mapPrismaToDomain(data: {
  id: string;
  tenantId: string;
  selfieRequired: boolean;
  gpsRequired: boolean;
  geofenceEnabled: boolean;
  qrCodeEnabled: boolean;
  directLoginEnabled: boolean;
  kioskModeEnabled: boolean;
  pwaEnabled: boolean;
  offlineAllowed: boolean;
  maxOfflineHours: number;
  toleranceMinutes: number;
  autoClockOutHours: number | null;
  pdfReceiptEnabled: boolean;
  defaultRadiusMeters: number;
  createdAt: Date;
  updatedAt: Date;
}): PunchConfiguration {
  return PunchConfiguration.create(
    {
      tenantId: data.tenantId,
      selfieRequired: data.selfieRequired,
      gpsRequired: data.gpsRequired,
      geofenceEnabled: data.geofenceEnabled,
      qrCodeEnabled: data.qrCodeEnabled,
      directLoginEnabled: data.directLoginEnabled,
      kioskModeEnabled: data.kioskModeEnabled,
      pwaEnabled: data.pwaEnabled,
      offlineAllowed: data.offlineAllowed,
      maxOfflineHours: data.maxOfflineHours,
      toleranceMinutes: data.toleranceMinutes,
      autoClockOutHours: data.autoClockOutHours,
      pdfReceiptEnabled: data.pdfReceiptEnabled,
      defaultRadiusMeters: data.defaultRadiusMeters,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    },
    new UniqueEntityID(data.id),
  );
}

export class PrismaPunchConfigRepository implements PunchConfigRepository {
  async findByTenantId(tenantId: string): Promise<PunchConfiguration | null> {
    const data = await prisma.punchConfiguration.findUnique({
      where: { tenantId },
    });

    if (!data) return null;

    return mapPrismaToDomain(data);
  }

  async create(tenantId: string): Promise<PunchConfiguration> {
    const data = await prisma.punchConfiguration.create({
      data: { tenantId },
    });

    return mapPrismaToDomain(data);
  }

  async update(
    tenantId: string,
    updateData: UpdatePunchConfigData,
  ): Promise<PunchConfiguration> {
    const data = await prisma.punchConfiguration.update({
      where: { tenantId },
      data: updateData,
    });

    return mapPrismaToDomain(data);
  }
}
