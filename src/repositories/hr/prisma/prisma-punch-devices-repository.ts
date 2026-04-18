import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PunchDevice } from '@/entities/hr/punch-device';
import { prisma } from '@/lib/prisma';
import { punchDevicePrismaToDomain } from '@/mappers/hr/punch-device/punch-device-prisma-to-domain';
import type {
  AgentStatus as PrismaAgentStatus,
  Prisma,
  PunchDeviceKind as PrismaPunchDeviceKind,
} from '@prisma/generated/client.js';
import type {
  CreatePunchDeviceWithAllowlist,
  FindManyPunchDevicesFilters,
  PunchDevicesRepository,
} from '../punch-devices-repository';

/**
 * Implementação Prisma do PunchDevicesRepository.
 *
 * Multi-tenant: toda query que aceita `tenantId` filtra por ele no `where`.
 * Soft-delete: `deletedAt: null` em lookups. Revogação: `revokedAt: null`
 * nos lookups por device token (hot-path do middleware Plan 3).
 */
export class PrismaPunchDevicesRepository implements PunchDevicesRepository {
  async create(device: PunchDevice): Promise<void> {
    await prisma.punchDevice.create({
      data: this.toPrismaData(device),
    });
  }

  async createWithAllowlist(
    input: CreatePunchDeviceWithAllowlist,
  ): Promise<void> {
    const { device, allowedEmployeeIds, allowedDepartmentIds } = input;
    const deviceId = device.id.toString();

    const txSteps: Prisma.PrismaPromise<unknown>[] = [
      prisma.punchDevice.create({ data: this.toPrismaData(device) }),
    ];

    if (allowedEmployeeIds && allowedEmployeeIds.length > 0) {
      txSteps.push(
        prisma.punchDeviceEmployee.createMany({
          data: allowedEmployeeIds.map((employeeId) => ({
            deviceId,
            employeeId,
          })),
          skipDuplicates: true,
        }),
      );
    }

    if (allowedDepartmentIds && allowedDepartmentIds.length > 0) {
      txSteps.push(
        prisma.punchDeviceDepartment.createMany({
          data: allowedDepartmentIds.map((departmentId) => ({
            deviceId,
            departmentId,
          })),
          skipDuplicates: true,
        }),
      );
    }

    await prisma.$transaction(txSteps);
  }

  async save(device: PunchDevice): Promise<void> {
    await prisma.punchDevice.update({
      where: { id: device.id.toString() },
      data: {
        name: device.name,
        deviceKind: device.deviceKind as PrismaPunchDeviceKind,
        pairingSecret: device.pairingSecret,
        deviceTokenHash: device.deviceTokenHash ?? null,
        deviceLabel: device.deviceLabel ?? null,
        geofenceZoneId: device.geofenceZoneId?.toString() ?? null,
        pairedAt: device.pairedAt ?? null,
        pairedByUserId: device.pairedByUserId ?? null,
        revokedAt: device.revokedAt ?? null,
        revokedByUserId: device.revokedByUserId ?? null,
        revokedReason: device.revokedReason ?? null,
        status: device.status as PrismaAgentStatus,
        lastSeenAt: device.lastSeenAt ?? null,
        ipAddress: device.ipAddress ?? null,
        hostname: device.hostname ?? null,
        osInfo:
          (device.osInfo as Prisma.InputJsonValue | undefined) ?? undefined,
        version: device.version ?? null,
        deletedAt: device.deletedAt ?? null,
      },
    });
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<PunchDevice | null> {
    const raw = await prisma.punchDevice.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    return raw ? punchDevicePrismaToDomain(raw) : null;
  }

  async findByDeviceTokenHash(hash: string): Promise<PunchDevice | null> {
    const raw = await prisma.punchDevice.findFirst({
      where: {
        deviceTokenHash: hash,
        deletedAt: null,
        revokedAt: null,
      },
    });

    return raw ? punchDevicePrismaToDomain(raw) : null;
  }

  async findAllUnpairedWithPairingSecret(
    tenantId: string,
    deviceId?: UniqueEntityID,
  ): Promise<PunchDevice[]> {
    const rows = await prisma.punchDevice.findMany({
      where: {
        tenantId,
        deletedAt: null,
        deviceTokenHash: null,
        revokedAt: null,
        pairingSecret: { not: '' },
        ...(deviceId ? { id: deviceId.toString() } : {}),
      },
    });

    return rows.map(punchDevicePrismaToDomain);
  }

  async findManyByTenantId(
    tenantId: string,
    filters?: FindManyPunchDevicesFilters,
  ): Promise<{ items: PunchDevice[]; total: number }> {
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 20;

    const where: Prisma.PunchDeviceWhereInput = {
      tenantId,
      deletedAt: null,
      ...(filters?.deviceKind
        ? { deviceKind: filters.deviceKind as PrismaPunchDeviceKind }
        : {}),
      ...(filters?.status
        ? { status: filters.status as PrismaAgentStatus }
        : {}),
      ...(filters?.includeRevoked ? {} : { revokedAt: null }),
    };

    const [rows, total] = await Promise.all([
      prisma.punchDevice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.punchDevice.count({ where }),
    ]);

    return { items: rows.map(punchDevicePrismaToDomain), total };
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.punchDevice.updateMany({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
      data: { deletedAt: new Date() },
    });
  }

  private toPrismaData(
    device: PunchDevice,
  ): Prisma.PunchDeviceUncheckedCreateInput {
    return {
      id: device.id.toString(),
      tenantId: device.tenantId.toString(),
      name: device.name,
      deviceKind: device.deviceKind as PrismaPunchDeviceKind,
      pairingSecret: device.pairingSecret,
      deviceTokenHash: device.deviceTokenHash ?? null,
      deviceLabel: device.deviceLabel ?? null,
      geofenceZoneId: device.geofenceZoneId?.toString() ?? null,
      pairedAt: device.pairedAt ?? null,
      pairedByUserId: device.pairedByUserId ?? null,
      revokedAt: device.revokedAt ?? null,
      revokedByUserId: device.revokedByUserId ?? null,
      revokedReason: device.revokedReason ?? null,
      status: device.status as PrismaAgentStatus,
      lastSeenAt: device.lastSeenAt ?? null,
      ipAddress: device.ipAddress ?? null,
      hostname: device.hostname ?? null,
      osInfo: (device.osInfo as Prisma.InputJsonValue | undefined) ?? undefined,
      version: device.version ?? null,
      createdAt: device.createdAt,
      deletedAt: device.deletedAt ?? null,
    };
  }
}
