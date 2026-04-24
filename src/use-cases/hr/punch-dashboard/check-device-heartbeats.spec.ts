import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CheckDeviceHeartbeatsUseCase,
  OFFLINE_THRESHOLD_MS,
  type HeartbeatPrisma,
  type HeartbeatPrismaDevice,
} from './check-device-heartbeats';

function makePrismaWithDevices(
  devices: HeartbeatPrismaDevice[],
): HeartbeatPrisma & {
  updateMock: ReturnType<typeof vi.fn>;
} {
  const updateMock = vi.fn(async () => ({}));
  const prisma: HeartbeatPrisma = {
    punchDevice: {
      findMany: vi.fn(async () => devices.map((d) => ({ ...d }))),
      update: updateMock,
    },
  };
  return Object.assign(prisma, { updateMock });
}

describe('CheckDeviceHeartbeatsUseCase', () => {
  const tenantId = 'tenant-1';
  const now = new Date('2026-04-24T10:00:00.000Z');

  it('ONLINE com lastSeenAt stale (> 3min) transita para OFFLINE', async () => {
    const prisma = makePrismaWithDevices([
      {
        id: 'device-1',
        status: 'ONLINE',
        lastSeenAt: new Date(now.getTime() - OFFLINE_THRESHOLD_MS - 10_000),
      },
    ]);
    const useCase = new CheckDeviceHeartbeatsUseCase(prisma);

    const result = await useCase.execute({ tenantId, now });

    expect(result.transitioned).toEqual([
      {
        deviceId: 'device-1',
        previousStatus: 'ONLINE',
        nextStatus: 'OFFLINE',
      },
    ]);
    expect(prisma.updateMock).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: { status: 'OFFLINE' },
    });
  });

  it('ONLINE com lastSeenAt=null transita para OFFLINE', async () => {
    const prisma = makePrismaWithDevices([
      { id: 'device-2', status: 'ONLINE', lastSeenAt: null },
    ]);
    const useCase = new CheckDeviceHeartbeatsUseCase(prisma);
    const result = await useCase.execute({ tenantId, now });
    expect(result.transitioned[0]?.nextStatus).toBe('OFFLINE');
  });

  it('OFFLINE com lastSeenAt recente (< 3min) transita para ONLINE', async () => {
    const prisma = makePrismaWithDevices([
      {
        id: 'device-3',
        status: 'OFFLINE',
        lastSeenAt: new Date(now.getTime() - 60_000),
      },
    ]);
    const useCase = new CheckDeviceHeartbeatsUseCase(prisma);
    const result = await useCase.execute({ tenantId, now });
    expect(result.transitioned).toEqual([
      {
        deviceId: 'device-3',
        previousStatus: 'OFFLINE',
        nextStatus: 'ONLINE',
      },
    ]);
  });

  it('ONLINE recente não transita (sem update call)', async () => {
    const prisma = makePrismaWithDevices([
      {
        id: 'device-4',
        status: 'ONLINE',
        lastSeenAt: new Date(now.getTime() - 30_000),
      },
    ]);
    const useCase = new CheckDeviceHeartbeatsUseCase(prisma);
    const result = await useCase.execute({ tenantId, now });
    expect(result.transitioned).toEqual([]);
    expect(prisma.updateMock).not.toHaveBeenCalled();
  });

  it('ERROR é preservado — nunca transita', async () => {
    const prisma = makePrismaWithDevices([
      { id: 'device-5', status: 'ERROR', lastSeenAt: null },
    ]);
    const useCase = new CheckDeviceHeartbeatsUseCase(prisma);
    const result = await useCase.execute({ tenantId, now });
    expect(result.transitioned).toEqual([]);
    expect(prisma.updateMock).not.toHaveBeenCalled();
  });

  it('mistura de devices: scanned + transitioned counts corretos', async () => {
    const prisma = makePrismaWithDevices([
      {
        id: 'stale-online',
        status: 'ONLINE',
        lastSeenAt: new Date(now.getTime() - OFFLINE_THRESHOLD_MS - 1_000),
      },
      {
        id: 'recent-offline',
        status: 'OFFLINE',
        lastSeenAt: new Date(now.getTime() - 30_000),
      },
      {
        id: 'fresh-online',
        status: 'ONLINE',
        lastSeenAt: new Date(now.getTime() - 5_000),
      },
      { id: 'error-device', status: 'ERROR', lastSeenAt: null },
    ]);
    const useCase = new CheckDeviceHeartbeatsUseCase(prisma);
    const result = await useCase.execute({ tenantId, now });

    expect(result.scanned).toBe(4);
    expect(result.transitioned).toHaveLength(2);
    expect(result.transitioned.map((t) => t.deviceId).sort()).toEqual([
      'recent-offline',
      'stale-online',
    ]);
  });

  it('OFFLINE_THRESHOLD_MS == 3 * 60 * 1000', () => {
    expect(OFFLINE_THRESHOLD_MS).toBe(3 * 60 * 1000);
  });
});
