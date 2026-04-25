import { createHash } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import websocket from '@fastify/websocket';
import fastify, { type FastifyInstance } from 'fastify';
import WebSocket from 'ws';

// Avoid eager @env initialization that the real logger pulls in
// (the unit project does not load `.env` for non-Prisma specs).
vi.mock('@/lib/logger', () => {
  const stubLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
  };
  return {
    logger: stubLogger,
    createLogger: () => stubLogger,
    httpLogger: stubLogger,
    dbLogger: stubLogger,
    authLogger: stubLogger,
    errorLogger: stubLogger,
    perfLogger: stubLogger,
  };
});

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryPosDevicePairingsRepository } from '@/repositories/sales/in-memory/in-memory-pos-device-pairings-repository';
import { makePosDevicePairing } from '@/utils/tests/factories/sales/make-pos-device-pairing';

import {
  __testing__,
  broadcastToTenant,
  broadcastToTerminal,
  registerPosWebSocketNamespace,
  setPosDevicePairingsRepositoryFactory,
} from './pos-namespace';

/**
 * Integration spec: spins up a minimal Fastify server with `@fastify/websocket`
 * and the POS namespace, then drives it with a real `ws` client. Auth is
 * exercised against an in-memory `PosDevicePairingsRepository` injected via
 * {@link setPosDevicePairingsRepositoryFactory}, so this spec does NOT need
 * Prisma or a database.
 */

const VALID_RAW_TOKEN = 'integration-token-valid-001';
const VALID_TOKEN_HASH = createHash('sha256')
  .update(VALID_RAW_TOKEN)
  .digest('hex');

const SECONDARY_RAW_TOKEN = 'integration-token-valid-002';
const SECONDARY_TOKEN_HASH = createHash('sha256')
  .update(SECONDARY_RAW_TOKEN)
  .digest('hex');

let server: FastifyInstance;
let serverUrl: string;
let pairingsRepository: InMemoryPosDevicePairingsRepository;
let validTerminalId: UniqueEntityID;
let validTenantId: UniqueEntityID;
let secondaryTerminalId: UniqueEntityID;

function buildServerUrl(address: string | { port: number } | null): string {
  if (!address || typeof address === 'string') {
    throw new Error('Expected Fastify to bind to a TCP port');
  }
  return `ws://127.0.0.1:${address.port}/v1/pos/ws`;
}

async function waitForOpen(socket: WebSocket): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', (error) => reject(error));
  });
}

interface CapturedClose {
  code: number;
  reason: string;
}

function captureNextClose(socket: WebSocket): Promise<CapturedClose> {
  return new Promise((resolve) => {
    socket.once('close', (code: number, reasonBuffer: Buffer) => {
      resolve({ code, reason: reasonBuffer.toString('utf8') });
    });
  });
}

function captureNextJsonMessage<T = unknown>(socket: WebSocket): Promise<T> {
  return new Promise((resolve, reject) => {
    socket.once('message', (raw: Buffer) => {
      try {
        resolve(JSON.parse(raw.toString('utf8')) as T);
      } catch (error) {
        reject(error);
      }
    });
  });
}

beforeAll(async () => {
  pairingsRepository = new InMemoryPosDevicePairingsRepository();

  validTenantId = new UniqueEntityID();
  validTerminalId = new UniqueEntityID();
  secondaryTerminalId = new UniqueEntityID();

  pairingsRepository.items.push(
    makePosDevicePairing({
      tenantId: validTenantId,
      terminalId: validTerminalId,
      deviceTokenHash: VALID_TOKEN_HASH,
      deviceLabel: 'Primary terminal',
    }),
    makePosDevicePairing({
      tenantId: validTenantId,
      terminalId: secondaryTerminalId,
      deviceTokenHash: SECONDARY_TOKEN_HASH,
      deviceLabel: 'Secondary terminal',
    }),
  );

  setPosDevicePairingsRepositoryFactory(() => pairingsRepository);

  server = fastify({ pluginTimeout: 0 });
  await server.register(websocket);
  await registerPosWebSocketNamespace(server);
  await server.listen({ port: 0, host: '127.0.0.1' });

  serverUrl = buildServerUrl(server.server.address());
});

afterAll(async () => {
  setPosDevicePairingsRepositoryFactory(null);
  __testing__.stopHeartbeatChecker();
  if (server) {
    await server.close();
  }
});

afterEach(() => {
  // Clear connection registry between cases so broadcast assertions are
  // deterministic. (Sockets are also closed below in each test.)
  __testing__.clearConnections();
});

describe('POS WebSocket namespace — handshake', () => {
  it('responds with welcome when hello carries a valid device token', async () => {
    const client = new WebSocket(serverUrl);
    await waitForOpen(client);

    const welcomePromise = captureNextJsonMessage<{
      type: string;
      terminalId: string;
    }>(client);

    client.send(
      JSON.stringify({ type: 'hello', deviceToken: VALID_RAW_TOKEN }),
    );

    const welcomeMessage = await welcomePromise;
    expect(welcomeMessage.type).toBe('welcome');
    expect(welcomeMessage.terminalId).toBe(validTerminalId.toString());

    client.close();
  });

  it('closes with code 4001 when hello is missing deviceToken', async () => {
    const client = new WebSocket(serverUrl);
    await waitForOpen(client);

    const closePromise = captureNextClose(client);
    client.send(JSON.stringify({ type: 'hello' }));

    const closeEvent = await closePromise;
    expect(closeEvent.code).toBe(4001);
  });

  it('closes with code 4002 when device token does not match any pairing', async () => {
    const client = new WebSocket(serverUrl);
    await waitForOpen(client);

    const closePromise = captureNextClose(client);
    client.send(
      JSON.stringify({
        type: 'hello',
        deviceToken: 'totally-bogus-not-in-repo',
      }),
    );

    const closeEvent = await closePromise;
    expect(closeEvent.code).toBe(4002);
  });

  it('closes with code 4002 when device pairing was revoked', async () => {
    const revokedRawToken = 'integration-token-revoked';
    const revokedHash = createHash('sha256')
      .update(revokedRawToken)
      .digest('hex');
    pairingsRepository.items.push(
      makePosDevicePairing({
        tenantId: validTenantId,
        deviceTokenHash: revokedHash,
        isActive: false,
        revokedByUserId: 'admin-1',
      }),
    );

    const client = new WebSocket(serverUrl);
    await waitForOpen(client);

    const closePromise = captureNextClose(client);
    client.send(
      JSON.stringify({ type: 'hello', deviceToken: revokedRawToken }),
    );

    const closeEvent = await closePromise;
    expect(closeEvent.code).toBe(4002);
  });
});

describe('POS WebSocket namespace — authenticated traffic', () => {
  it('replies with heartbeat-ack when an authenticated terminal sends heartbeat', async () => {
    const client = new WebSocket(serverUrl);
    await waitForOpen(client);

    const welcomePromise = captureNextJsonMessage<{ type: string }>(client);
    client.send(
      JSON.stringify({ type: 'hello', deviceToken: VALID_RAW_TOKEN }),
    );
    await welcomePromise;

    const ackPromise = captureNextJsonMessage<{ type: string }>(client);
    client.send(JSON.stringify({ type: 'heartbeat' }));

    const ackMessage = await ackPromise;
    expect(ackMessage.type).toBe('heartbeat-ack');

    client.close();
  });

  it('replies with deferral notice when terminal attempts sale.submit over WS (Phase 1)', async () => {
    const client = new WebSocket(serverUrl);
    await waitForOpen(client);

    const welcomePromise = captureNextJsonMessage<{ type: string }>(client);
    client.send(
      JSON.stringify({ type: 'hello', deviceToken: VALID_RAW_TOKEN }),
    );
    await welcomePromise;

    const deferredPromise = captureNextJsonMessage<{
      type: string;
      message: string;
    }>(client);
    client.send(JSON.stringify({ type: 'sale.submit', payload: {} }));

    const deferredMessage = await deferredPromise;
    expect(deferredMessage.type).toBe('sale.submit.deferred');
    expect(deferredMessage.message).toMatch(/POST \/v1\/pos\/sales/);

    client.close();
  });
});

describe('POS WebSocket namespace — broadcast utilities', () => {
  it('broadcastToTenant delivers the event to every connected terminal of the tenant', async () => {
    const primaryClient = new WebSocket(serverUrl);
    await waitForOpen(primaryClient);
    const primaryWelcome = captureNextJsonMessage<{ type: string }>(
      primaryClient,
    );
    primaryClient.send(
      JSON.stringify({ type: 'hello', deviceToken: VALID_RAW_TOKEN }),
    );
    await primaryWelcome;

    const secondaryClient = new WebSocket(serverUrl);
    await waitForOpen(secondaryClient);
    const secondaryWelcome = captureNextJsonMessage<{ type: string }>(
      secondaryClient,
    );
    secondaryClient.send(
      JSON.stringify({ type: 'hello', deviceToken: SECONDARY_RAW_TOKEN }),
    );
    await secondaryWelcome;

    const primaryReceived = captureNextJsonMessage<{ type: string }>(
      primaryClient,
    );
    const secondaryReceived = captureNextJsonMessage<{ type: string }>(
      secondaryClient,
    );

    const delivered = broadcastToTenant(validTenantId.toString(), {
      type: 'stock.changed',
      itemId: 'item-1',
      newQuantity: 7,
    });
    expect(delivered).toBe(2);

    const primaryEvent = await primaryReceived;
    const secondaryEvent = await secondaryReceived;
    expect(primaryEvent.type).toBe('stock.changed');
    expect(secondaryEvent.type).toBe('stock.changed');

    primaryClient.close();
    secondaryClient.close();
  });

  it('broadcastToTerminal targets only the matching terminal', async () => {
    const primaryClient = new WebSocket(serverUrl);
    await waitForOpen(primaryClient);
    const primaryWelcome = captureNextJsonMessage<{ type: string }>(
      primaryClient,
    );
    primaryClient.send(
      JSON.stringify({ type: 'hello', deviceToken: VALID_RAW_TOKEN }),
    );
    await primaryWelcome;

    const secondaryClient = new WebSocket(serverUrl);
    await waitForOpen(secondaryClient);
    const secondaryWelcome = captureNextJsonMessage<{ type: string }>(
      secondaryClient,
    );
    secondaryClient.send(
      JSON.stringify({ type: 'hello', deviceToken: SECONDARY_RAW_TOKEN }),
    );
    await secondaryWelcome;

    let secondaryReceivedAny = false;
    secondaryClient.once('message', () => {
      secondaryReceivedAny = true;
    });

    const primaryReceived = captureNextJsonMessage<{ type: string }>(
      primaryClient,
    );

    const delivered = broadcastToTerminal(validTerminalId.toString(), {
      type: 'terminal.command',
      command: 'force-logout',
    });
    expect(delivered).toBe(1);

    const primaryEvent = await primaryReceived;
    expect(primaryEvent.type).toBe('terminal.command');

    // Give the loopback a tick to deliver any (incorrect) message to the
    // secondary client before we assert it received nothing.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(secondaryReceivedAny).toBe(false);
    expect(secondaryTerminalId.toString()).not.toBe(validTerminalId.toString());

    primaryClient.close();
    secondaryClient.close();
  });
});
