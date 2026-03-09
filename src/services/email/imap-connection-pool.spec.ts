import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// Mock ImapFlow to avoid real IMAP connections
let connectCallCount = 0;
vi.mock('imapflow', () => {
  const FakeImapFlow = class {
    usable = true;
    connect = vi.fn().mockImplementation(async () => {
      connectCallCount++;
    });
    logout = vi.fn().mockResolvedValue(undefined);
    on = vi.fn();
    getMailboxLock = vi.fn().mockResolvedValue({
      release: vi.fn(),
    });
  };
  return { ImapFlow: FakeImapFlow };
});

import {
  ImapConnectionPool,
  resetImapConnectionPool,
} from './imap-connection-pool';

const CONFIG = {
  host: 'imap.example.com',
  port: 993,
  secure: true,
  username: 'user@example.com',
  secret: 'password',
};

describe('ImapConnectionPool', () => {
  let pool: ImapConnectionPool;

  beforeEach(() => {
    connectCallCount = 0;
    pool = new ImapConnectionPool(500); // 500ms idle TTL for fast tests
  });

  afterEach(async () => {
    await pool.destroyAll();
    resetImapConnectionPool();
  });

  it('should create a new connection on first acquire', async () => {
    const client = await pool.acquire('acc-1', CONFIG);
    expect(client).toBeDefined();
    expect(client.connect).toHaveBeenCalledOnce();
    expect(pool.size).toBe(1);
    pool.release('acc-1');
  });

  it('should reuse idle connection on second acquire', async () => {
    const client1 = await pool.acquire('acc-1', CONFIG);
    pool.release('acc-1');

    const client2 = await pool.acquire('acc-1', CONFIG);
    expect(client2).toBe(client1);
    // connect should have been called only once (first acquire)
    expect(connectCallCount).toBe(1);
    pool.release('acc-1');
  });

  it('should create separate connections for different accounts', async () => {
    const client1 = await pool.acquire('acc-1', CONFIG);
    const client2 = await pool.acquire('acc-2', CONFIG);

    expect(client1).not.toBe(client2);
    expect(pool.size).toBe(2);
    expect(connectCallCount).toBe(2);

    pool.release('acc-1');
    pool.release('acc-2');
  });

  it('should close connection after idle TTL', async () => {
    const client = await pool.acquire('acc-1', CONFIG);
    pool.release('acc-1');

    expect(pool.has('acc-1')).toBe(true);

    // Wait for idle TTL to expire
    await new Promise((r) => setTimeout(r, 600));

    expect(pool.has('acc-1')).toBe(false);
    expect(client.logout).toHaveBeenCalled();
  });

  it('should destroy connection and remove from pool', async () => {
    await pool.acquire('acc-1', CONFIG);
    pool.destroy('acc-1');

    expect(pool.has('acc-1')).toBe(false);
    expect(pool.size).toBe(0);
  });

  it('should destroy all connections', async () => {
    await pool.acquire('acc-1', CONFIG);
    await pool.acquire('acc-2', CONFIG);
    pool.release('acc-1');
    pool.release('acc-2');

    expect(pool.size).toBe(2);
    await pool.destroyAll();
    expect(pool.size).toBe(0);
  });

  it('should queue second caller when connection is busy', async () => {
    await pool.acquire('acc-1', CONFIG);

    // Second acquire should wait
    let secondResolved = false;
    const secondPromise = pool.acquire('acc-1', CONFIG).then((c) => {
      secondResolved = true;
      return c;
    });

    // Not resolved yet
    await new Promise((r) => setTimeout(r, 50));
    expect(secondResolved).toBe(false);

    // Release first → second should get the connection
    pool.release('acc-1');
    const client2 = await secondPromise;
    expect(secondResolved).toBe(true);
    expect(client2).toBeDefined();
    // Only 1 connect call (reused)
    expect(connectCallCount).toBe(1);
    pool.release('acc-1');
  });

  it('should handle release with no entry gracefully', () => {
    // Should not throw
    pool.release('nonexistent');
  });

  it('should handle destroy with no entry gracefully', () => {
    // Should not throw
    pool.destroy('nonexistent');
  });
});
