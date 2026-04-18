import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock prisma BEFORE importing the module under test — vitest hoists vi.mock
// above imports so the mocked client is used everywhere.
vi.mock('@/lib/prisma', () => ({
  prisma: {
    punchDevice: {
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue(undefined),
    },
  },
}));

import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { prisma } from '@/lib/prisma';
import type { FastifyRequest } from 'fastify';

import { verifyPunchDeviceToken } from './verify-punch-device-token';

type MockedPrisma = typeof prisma & {
  punchDevice: {
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const mockedPrisma = prisma as unknown as MockedPrisma;

function buildRequest(
  token?: string,
): FastifyRequest & { punchDevice?: unknown; tenantId?: string } {
  // Minimal FastifyRequest stub — we only touch `headers` and the two
  // properties the middleware writes (`punchDevice`, `tenantId`).
  const headers: Record<string, string> = {};
  if (token !== undefined) headers['x-punch-device-token'] = token;
  return { headers } as unknown as FastifyRequest & {
    punchDevice?: unknown;
    tenantId?: string;
  };
}

describe('verifyPunchDeviceToken', () => {
  beforeEach(() => {
    mockedPrisma.punchDevice.findUnique.mockReset();
    mockedPrisma.punchDevice.update.mockReset();
    mockedPrisma.punchDevice.update.mockResolvedValue(undefined);
  });

  it('throws UnauthorizedError when the header is absent', async () => {
    const request = buildRequest();
    await expect(verifyPunchDeviceToken(request)).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
    await expect(verifyPunchDeviceToken(request)).rejects.toThrow(
      /Missing punch device token/,
    );
    expect(mockedPrisma.punchDevice.findUnique).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the hash does not match any device', async () => {
    mockedPrisma.punchDevice.findUnique.mockResolvedValue(null);
    const request = buildRequest('non-existent-token');

    await expect(verifyPunchDeviceToken(request)).rejects.toThrow(
      /Invalid or revoked punch device token/,
    );

    const expectedHash = createHash('sha256')
      .update('non-existent-token')
      .digest('hex');
    expect(mockedPrisma.punchDevice.findUnique).toHaveBeenCalledWith({
      where: { deviceTokenHash: expectedHash },
    });
  });

  it('rejects revoked devices (revokedAt is not null)', async () => {
    mockedPrisma.punchDevice.findUnique.mockResolvedValue({
      id: 'device-1',
      tenantId: 'tenant-1',
      deviceKind: 'KIOSK_PUBLIC',
      geofenceZoneId: null,
      revokedAt: new Date(),
      deletedAt: null,
    });
    const request = buildRequest('some-token');

    await expect(verifyPunchDeviceToken(request)).rejects.toThrow(
      /Invalid or revoked punch device token/,
    );
  });

  it('rejects soft-deleted devices (deletedAt is not null)', async () => {
    mockedPrisma.punchDevice.findUnique.mockResolvedValue({
      id: 'device-1',
      tenantId: 'tenant-1',
      deviceKind: 'KIOSK_PUBLIC',
      geofenceZoneId: null,
      revokedAt: null,
      deletedAt: new Date(),
    });
    const request = buildRequest('some-token');

    await expect(verifyPunchDeviceToken(request)).rejects.toThrow(
      /Invalid or revoked punch device token/,
    );
  });

  it('happy path: populates request.punchDevice and request.tenantId from the device row', async () => {
    mockedPrisma.punchDevice.findUnique.mockResolvedValue({
      id: 'device-1',
      tenantId: 'tenant-42',
      deviceKind: 'PWA_PERSONAL',
      geofenceZoneId: 'zone-xyz',
      revokedAt: null,
      deletedAt: null,
    });
    const request = buildRequest('raw-token');

    await verifyPunchDeviceToken(request);

    const expectedHash = createHash('sha256').update('raw-token').digest('hex');
    expect(mockedPrisma.punchDevice.findUnique).toHaveBeenCalledWith({
      where: { deviceTokenHash: expectedHash },
    });

    expect(request.punchDevice).toEqual({
      id: 'device-1',
      tenantId: 'tenant-42',
      deviceKind: 'PWA_PERSONAL',
      geofenceZoneId: 'zone-xyz',
    });
    expect((request as { tenantId?: string }).tenantId).toBe('tenant-42');
  });

  it('fires the heartbeat update but does not await it (fire-and-forget)', async () => {
    mockedPrisma.punchDevice.findUnique.mockResolvedValue({
      id: 'device-1',
      tenantId: 'tenant-1',
      deviceKind: 'KIOSK_PUBLIC',
      geofenceZoneId: null,
      revokedAt: null,
      deletedAt: null,
    });
    // Heartbeat write rejects — auth MUST still succeed.
    mockedPrisma.punchDevice.update.mockRejectedValue(
      new Error('transient DB error'),
    );
    const request = buildRequest('token');

    await expect(verifyPunchDeviceToken(request)).resolves.toBeUndefined();
    expect(mockedPrisma.punchDevice.update).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: expect.objectContaining({ status: 'ONLINE' }),
    });
  });
});
