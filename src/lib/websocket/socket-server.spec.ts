import { describe, expect, it, vi } from 'vitest';

// Hoisted mocks — required because socket-server.ts imports modules with
// eager side-effects (Redis client, env-based logger). We only care about
// testing the connection handler dispatch, so we stub all dependencies.
const mocks = vi.hoisted(() => ({
  joinHrRoomsForUser: vi.fn<() => Promise<void>>(),
  registerSocketHandlers: vi.fn(),
  createAdapter: vi.fn(),
  getRedisClient: vi.fn(() => ({ duplicate: () => ({}) })),
  authenticateSocket: vi.fn(),
}));

vi.mock('./hr-socket-scope', () => ({
  joinHrRoomsForUser: mocks.joinHrRoomsForUser,
}));

vi.mock('./socket-handlers', () => ({
  registerSocketHandlers: mocks.registerSocketHandlers,
}));

vi.mock('./socket-auth', () => ({
  authenticateSocket: mocks.authenticateSocket,
}));

vi.mock('@/lib/redis', () => ({
  getRedisClient: mocks.getRedisClient,
}));

vi.mock('@socket.io/redis-adapter', () => ({
  createAdapter: mocks.createAdapter,
}));

vi.mock('socket.io', () => ({
  Server: class FakeServer {
    // Unused in these tests; initializeSocketServer is NOT invoked.
  },
}));

import { handleSocketConnection } from './socket-server';

describe('handleSocketConnection', () => {
  it('browser w/ userId: joins tenant + browsers + user:{id} + calls joinHrRoomsForUser', async () => {
    mocks.joinHrRoomsForUser.mockResolvedValue(undefined);
    const join = vi.fn();
    const socket = {
      data: { type: 'browser', userId: 'U1', tenantId: 'T1' },
      join,
    } as never;

    await handleSocketConnection(socket);

    expect(join).toHaveBeenCalledWith('tenant:T1');
    expect(join).toHaveBeenCalledWith('tenant:T1:browsers');
    expect(join).toHaveBeenCalledWith('user:U1');
    expect(mocks.joinHrRoomsForUser).toHaveBeenCalledWith(socket, 'U1', 'T1');
  });

  it('agent: joins agent:{id} + does NOT call joinHrRoomsForUser', async () => {
    mocks.joinHrRoomsForUser.mockClear();
    const join = vi.fn();
    const socket = {
      data: { type: 'agent', agentId: 'A1', tenantId: 'T1' },
      join,
    } as never;

    await handleSocketConnection(socket);

    expect(join).toHaveBeenCalledWith('tenant:T1');
    expect(join).toHaveBeenCalledWith('tenant:T1:agents');
    expect(join).toHaveBeenCalledWith('agent:A1');
    expect(mocks.joinHrRoomsForUser).not.toHaveBeenCalled();
  });

  it('browser without userId (misconfigured): does NOT call joinHrRoomsForUser', async () => {
    mocks.joinHrRoomsForUser.mockClear();
    const join = vi.fn();
    const socket = {
      data: { type: 'browser', tenantId: 'T1' },
      join,
    } as never;

    await handleSocketConnection(socket);

    expect(join).toHaveBeenCalledWith('tenant:T1');
    expect(join).toHaveBeenCalledWith('tenant:T1:browsers');
    expect(mocks.joinHrRoomsForUser).not.toHaveBeenCalled();
  });
});
