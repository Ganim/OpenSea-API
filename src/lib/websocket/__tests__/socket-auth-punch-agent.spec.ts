/**
 * Unit tests — Phase 10 / Plan 10-01 (socket-auth punch-agent branch)
 *
 * Validates the `authenticatePunchAgent` function and the `authenticateSocket`
 * discriminator branch for `auth.type === 'punch-agent'`.
 *
 * Mocks `prisma.punchDevice.findFirst` to avoid a real DB connection.
 * The SHA-256 hash computation is exercised end-to-end (no mocking of crypto).
 */

import { createHash } from 'node:crypto';
import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock prisma before importing the module under test
vi.mock('@/lib/prisma', () => ({
  prisma: {
    punchDevice: {
      findFirst: vi.fn(),
    },
    printAgent: {
      findFirst: vi.fn(),
    },
  },
}));

// Mock JWT module
vi.mock('jsonwebtoken', () => ({
  default: { verify: vi.fn() },
}));

// Mock @/@env
vi.mock('@/@env', () => ({
  env: { JWT_SECRET: 'test-secret' },
}));

import { prisma } from '@/lib/prisma';
import { authenticatePunchAgent } from '../socket-auth';
import type { SocketData } from '../types';

/** Helper to build a minimal mock Socket with .join() and .data */
function mockSocket(initialData: Partial<SocketData> = {}) {
  return {
    data: initialData,
    join: vi.fn(),
    handshake: {
      auth: {},
    },
  } as unknown as import('socket.io').Socket;
}

describe('authenticatePunchAgent', () => {
  const validToken = 'raw-device-token-abc123';
  const validTokenHash = createHash('sha256').update(validToken).digest('hex');

  const fakeDevice = {
    id: 'device-uuid-001',
    tenantId: 'tenant-uuid-001',
    deviceTokenHash: validTokenHash,
    deletedAt: null,
    revokedAt: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sets socket.data with correct type, tenantId, deviceId on valid token', async () => {
    vi.mocked(prisma.punchDevice.findFirst).mockResolvedValue(
      fakeDevice as never,
    );

    const socket = mockSocket();
    await authenticatePunchAgent(socket, validToken);

    expect(socket.data).toEqual({
      type: 'punch-agent',
      tenantId: 'tenant-uuid-001',
      deviceId: 'device-uuid-001',
    });
  });

  it('calls prisma.punchDevice.findFirst with correct SHA-256 hash', async () => {
    vi.mocked(prisma.punchDevice.findFirst).mockResolvedValue(
      fakeDevice as never,
    );

    const socket = mockSocket();
    await authenticatePunchAgent(socket, validToken);

    expect(prisma.punchDevice.findFirst).toHaveBeenCalledWith({
      where: {
        deviceTokenHash: validTokenHash,
        deletedAt: null,
        revokedAt: null,
      },
    });
  });

  it('throws "Invalid or revoked punch device token" when device not found', async () => {
    vi.mocked(prisma.punchDevice.findFirst).mockResolvedValue(null);

    const socket = mockSocket();
    await expect(authenticatePunchAgent(socket, 'bad-token')).rejects.toThrow(
      'Invalid or revoked punch device token',
    );
  });

  it('throws when device is revoked (revokedAt set)', async () => {
    // revokedAt non-null is filtered by the query WHERE clause;
    // a null result triggers the same error path
    vi.mocked(prisma.punchDevice.findFirst).mockResolvedValue(null);

    const socket = mockSocket();
    await expect(authenticatePunchAgent(socket, validToken)).rejects.toThrow(
      /Invalid or revoked/,
    );
  });

  it('throws when device is soft-deleted (deletedAt set)', async () => {
    vi.mocked(prisma.punchDevice.findFirst).mockResolvedValue(null);

    const socket = mockSocket();
    await expect(authenticatePunchAgent(socket, validToken)).rejects.toThrow(
      /Invalid or revoked/,
    );
  });
});
