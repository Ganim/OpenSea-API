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
import type { WebSocket as WsServerSocket } from 'ws';

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

import {
  clearAgentConnectionsForTesting,
  getConnectedAgentCount,
  registerAgentConnection,
  unregisterAgentConnection,
} from '@/lib/websocket/print-agent-connections';
import {
  NoPrintServerConnectedError,
  PRINT_SERVER_COMMAND_TYPE,
  PrintServerReceiptClient,
} from './print-server-receipt-client';

/**
 * Integration spec: spins up a minimal Fastify server with @fastify/websocket
 * and a test-only `/v1/test/print-agent` route that simulates the production
 * print-agent endpoint without depending on Prisma. Each connecting client
 * passes `?agentId=...&tenantId=...` query parameters that we register
 * directly into the real connection registry, then we drive
 * {@link PrintServerReceiptClient} from the backend side and assert the
 * mock PrintServer receives the wire-level command.
 *
 * This validates the full chain:
 *   client.printReceipt(...)
 *     → broadcastToPrintServer(tenantId, command)
 *     → ws.send(...)
 *     → mock PrintServer's `message` listener
 */

interface TestPrintServerHandle {
  socket: WebSocket;
  nextMessage<T = unknown>(): Promise<T>;
  close(): Promise<void>;
}

const TENANT_WITH_AGENT = 'tenant-merchant-emporion';
const TENANT_WITHOUT_AGENT = 'tenant-no-printserver';

let server: FastifyInstance;
let serverUrl: string;

function buildServerUrl(address: string | { port: number } | null): string {
  if (!address || typeof address === 'string') {
    throw new Error('Expected Fastify to bind to a TCP port');
  }
  return `ws://127.0.0.1:${address.port}/v1/test/print-agent`;
}

async function waitForOpen(socket: WebSocket): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    socket.once('open', () => resolve());
    socket.once('error', (error) => reject(error));
  });
}

async function connectMockPrintServer(
  agentId: string,
  tenantId: string,
): Promise<TestPrintServerHandle> {
  const url = `${serverUrl}?agentId=${encodeURIComponent(
    agentId,
  )}&tenantId=${encodeURIComponent(tenantId)}`;
  const socket = new WebSocket(url);
  await waitForOpen(socket);

  // Wait until the server-side handler has registered the connection
  // before resolving — otherwise broadcasts could race the registry.
  await waitForRegisteredCount(1);

  const messageQueue: unknown[] = [];
  const waiters: Array<(value: unknown) => void> = [];

  socket.on('message', (raw: Buffer) => {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.toString('utf8'));
    } catch {
      parsed = raw.toString('utf8');
    }
    const waiter = waiters.shift();
    if (waiter) {
      waiter(parsed);
    } else {
      messageQueue.push(parsed);
    }
  });

  return {
    socket,
    nextMessage<T = unknown>(): Promise<T> {
      if (messageQueue.length > 0) {
        return Promise.resolve(messageQueue.shift() as T);
      }
      return new Promise<T>((resolve) => {
        waiters.push((value) => resolve(value as T));
      });
    },
    async close(): Promise<void> {
      if (
        socket.readyState === socket.OPEN ||
        socket.readyState === socket.CONNECTING
      ) {
        await new Promise<void>((resolve) => {
          socket.once('close', () => resolve());
          socket.close();
        });
      }
    },
  };
}

async function waitForRegisteredCount(expected: number): Promise<void> {
  const deadline = Date.now() + 1000;
  while (getConnectedAgentCount() < expected) {
    if (Date.now() > deadline) {
      throw new Error(
        `Timed out waiting for ${expected} registered agent(s); have ${getConnectedAgentCount()}`,
      );
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

beforeAll(async () => {
  server = fastify({ pluginTimeout: 0 });
  await server.register(websocket);

  // Test-only WebSocket route that skips Prisma auth and registers the
  // incoming socket into the real connection registry. The integration
  // proves that the real `broadcastToPrintServer` reaches a real ws
  // peer; faking the auth layer keeps the spec database-free.
  server.get<{
    Querystring: { agentId?: string; tenantId?: string };
  }>(
    '/v1/test/print-agent',
    { websocket: true },
    async (socket: WsServerSocket, request) => {
      const { agentId, tenantId } = request.query;
      if (!agentId || !tenantId) {
        socket.close(4001, 'Missing agentId or tenantId');
        return;
      }
      registerAgentConnection(agentId, socket, tenantId);
      socket.on('close', () => unregisterAgentConnection(agentId));
    },
  );

  await server.listen({ port: 0, host: '127.0.0.1' });
  serverUrl = buildServerUrl(server.server.address());
});

afterAll(async () => {
  if (server) {
    await server.close();
  }
});

afterEach(() => {
  clearAgentConnectionsForTesting();
});

describe('PrintServerReceiptClient (integration)', () => {
  it('dispatches a print command to a connected PrintServer for the tenant', async () => {
    const printServer = await connectMockPrintServer(
      'agent-bar-counter-001',
      TENANT_WITH_AGENT,
    );

    const client = new PrintServerReceiptClient();
    const escposPayload = Buffer.from('===CUPOM-FISCAL-NFC-E===', 'utf8');

    const messagePromise = printServer.nextMessage<Record<string, unknown>>();

    const { jobId } = await client.printReceipt({
      tenantId: TENANT_WITH_AGENT,
      printerId: 'printer-receipt-front',
      escposData: escposPayload,
      copies: 1,
    });

    const receivedCommand = await messagePromise;
    expect(receivedCommand).toEqual({
      type: PRINT_SERVER_COMMAND_TYPE,
      jobId,
      printerId: 'printer-receipt-front',
      data: escposPayload.toString('base64'),
      copies: 1,
    });

    await printServer.close();
  });

  it('throws NoPrintServerConnectedError when the tenant has no connected PrintServer', async () => {
    const client = new PrintServerReceiptClient();

    await expect(
      client.printReceipt({
        tenantId: TENANT_WITHOUT_AGENT,
        printerId: 'printer-orphan',
        escposData: Buffer.from('cupom'),
      }),
    ).rejects.toBeInstanceOf(NoPrintServerConnectedError);
  });

  it('does NOT deliver the command to PrintServers connected for a different tenant', async () => {
    const otherTenantPrintServer = await connectMockPrintServer(
      'agent-other-tenant-001',
      'tenant-completely-different',
    );

    let receivedAnything = false;
    otherTenantPrintServer.socket.once('message', () => {
      receivedAnything = true;
    });

    const client = new PrintServerReceiptClient();

    // Broadcast to a tenant with NO connected PrintServer should fail —
    // and crucially must NOT leak into the other-tenant socket.
    await expect(
      client.printReceipt({
        tenantId: TENANT_WITHOUT_AGENT,
        printerId: 'printer-cross-tenant',
        escposData: Buffer.from('do-not-leak'),
      }),
    ).rejects.toBeInstanceOf(NoPrintServerConnectedError);

    // Give the loopback a tick to deliver any (incorrect) message before
    // we assert the negative outcome.
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(receivedAnything).toBe(false);

    await otherTenantPrintServer.close();
  });
});
