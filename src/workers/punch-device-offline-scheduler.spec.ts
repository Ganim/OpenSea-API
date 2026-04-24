import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  tenantFindMany: vi.fn(),
  auditLogCreate: vi.fn(),
  useCaseExecute: vi.fn(),
  busPublish: vi.fn(),
  ioEmit: vi.fn(),
  ioToChain: vi.fn(),
}));

vi.mock('@/@env', () => ({
  env: { NODE_ENV: 'test', BULLMQ_ENABLED: false },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: { findMany: mocks.tenantFindMany },
    auditLog: { create: mocks.auditLogCreate },
  },
}));

vi.mock('@/lib/events', () => ({
  getTypedEventBus: () => ({ publish: mocks.busPublish }),
}));

vi.mock('@/lib/websocket/socket-server', () => ({
  getSocketServer: () => ({
    to: (..._args: unknown[]) => {
      mocks.ioToChain(..._args);
      return { emit: mocks.ioEmit };
    },
  }),
}));

vi.mock(
  '@/use-cases/hr/punch-dashboard/factories/make-check-device-heartbeats',
  () => ({
    makeCheckDeviceHeartbeatsUseCase: () => ({ execute: mocks.useCaseExecute }),
  }),
);

import { runPunchDeviceOfflineIfDue } from './punch-device-offline-scheduler';

describe('runPunchDeviceOfflineIfDue', () => {
  beforeEach(() => {
    for (const m of Object.values(mocks)) m.mockReset();
    process.env.BULLMQ_ENABLED = 'true';
  });

  it('gate BULLMQ_ENABLED: skipa quando !=true', async () => {
    process.env.BULLMQ_ENABLED = 'false';
    await runPunchDeviceOfflineIfDue();
    expect(mocks.tenantFindMany).not.toHaveBeenCalled();
  });

  it('executa use case para cada tenant, sem transitions → sem side effects', async () => {
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a' },
      { id: 'tenant-b' },
    ]);
    mocks.useCaseExecute.mockResolvedValue({
      transitioned: [],
      scanned: 0,
    });

    await runPunchDeviceOfflineIfDue();

    expect(mocks.useCaseExecute).toHaveBeenCalledTimes(2);
    expect(mocks.ioEmit).not.toHaveBeenCalled();
    expect(mocks.auditLogCreate).not.toHaveBeenCalled();
    expect(mocks.busPublish).not.toHaveBeenCalled();
  });

  it('transition detectada: emite Socket.IO + grava AuditLog + publica evento', async () => {
    mocks.tenantFindMany.mockResolvedValue([{ id: 'tenant-a' }]);
    mocks.useCaseExecute.mockResolvedValue({
      transitioned: [
        {
          deviceId: 'device-1',
          previousStatus: 'ONLINE',
          nextStatus: 'OFFLINE',
        },
      ],
      scanned: 1,
    });
    mocks.auditLogCreate.mockResolvedValue({});

    await runPunchDeviceOfflineIfDue();

    // Socket.IO emit em tenant:{id}:hr.
    expect(mocks.ioToChain).toHaveBeenCalledWith('tenant:tenant-a:hr');
    expect(mocks.ioEmit).toHaveBeenCalledTimes(1);
    const [event, payload] = mocks.ioEmit.mock.calls[0];
    expect(event).toBe('tenant.hr.devices.status-change');
    expect(payload).toMatchObject({
      deviceId: 'device-1',
      previousStatus: 'ONLINE',
      nextStatus: 'OFFLINE',
    });
    expect(payload.changedAt).toEqual(expect.any(String));

    // Audit log gravado.
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(1);
    const auditArgs = mocks.auditLogCreate.mock.calls[0][0];
    expect(auditArgs.data.action).toBe('PUNCH_DEVICE_STATUS_CHANGED');
    expect(auditArgs.data.entity).toBe('PUNCH_DEVICE');
    expect(auditArgs.data.module).toBe('HR');
    expect(auditArgs.data.entityId).toBe('device-1');

    // Event bus publicado.
    expect(mocks.busPublish).toHaveBeenCalledTimes(1);
    const evt = mocks.busPublish.mock.calls[0][0];
    expect(evt.type).toBe('punch.device.status-changed');
    expect(evt.data).toMatchObject({
      tenantId: 'tenant-a',
      deviceId: 'device-1',
      previousStatus: 'ONLINE',
      nextStatus: 'OFFLINE',
    });
  });

  it('múltiplas transições em 1 tenant — 1 emit + 1 audit + 1 publish cada', async () => {
    mocks.tenantFindMany.mockResolvedValue([{ id: 'tenant-a' }]);
    mocks.useCaseExecute.mockResolvedValue({
      transitioned: [
        { deviceId: 'd-1', previousStatus: 'ONLINE', nextStatus: 'OFFLINE' },
        { deviceId: 'd-2', previousStatus: 'OFFLINE', nextStatus: 'ONLINE' },
      ],
      scanned: 2,
    });
    mocks.auditLogCreate.mockResolvedValue({});

    await runPunchDeviceOfflineIfDue();

    expect(mocks.ioEmit).toHaveBeenCalledTimes(2);
    expect(mocks.auditLogCreate).toHaveBeenCalledTimes(2);
    expect(mocks.busPublish).toHaveBeenCalledTimes(2);
  });

  it('erro no audit log não bloqueia o fluxo (best-effort)', async () => {
    mocks.tenantFindMany.mockResolvedValue([{ id: 'tenant-a' }]);
    mocks.useCaseExecute.mockResolvedValue({
      transitioned: [
        { deviceId: 'd-1', previousStatus: 'ONLINE', nextStatus: 'OFFLINE' },
      ],
      scanned: 1,
    });
    mocks.auditLogCreate.mockRejectedValue(new Error('db down'));

    await expect(runPunchDeviceOfflineIfDue()).resolves.toBeUndefined();
    // Mesmo com audit falhando, socket emit deve ter sido chamado antes.
    expect(mocks.ioEmit).toHaveBeenCalledTimes(1);
  });

  it('erro no useCase de 1 tenant não bloqueia o próximo', async () => {
    mocks.tenantFindMany.mockResolvedValue([
      { id: 'tenant-a' },
      { id: 'tenant-b' },
    ]);
    mocks.useCaseExecute
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce({ transitioned: [], scanned: 0 });

    await runPunchDeviceOfflineIfDue();

    expect(mocks.useCaseExecute).toHaveBeenCalledTimes(2);
  });
});
