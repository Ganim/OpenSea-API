import { createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock prisma before importing the module under test
const mockFindUnique = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    bankAccount: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

import { verifyWebhookSignature } from './verify-webhook-signature';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSignature(secret: string, body: unknown): string {
  return createHmac('sha256', secret)
    .update(JSON.stringify(body))
    .digest('hex');
}

function makeRequest(overrides: {
  bankAccountId?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
}): Parameters<typeof verifyWebhookSignature>[0] {
  return {
    query: { bankAccountId: overrides.bankAccountId ?? 'test-account-id' },
    headers: overrides.headers ?? {},
    body: overrides.body ?? { event: 'PIX_RECEIVED', amount: 100 },
  } as unknown as Parameters<typeof verifyWebhookSignature>[0];
}

type SentPayload = { message: string };

function makeReply(): {
  reply: Parameters<typeof verifyWebhookSignature>[1];
  statusCode: () => number | undefined;
  sentPayload: () => SentPayload | undefined;
} {
  let code: number | undefined;
  let payload: SentPayload | undefined;

  const sendFn = vi.fn((body: SentPayload) => {
    payload = body;
  });

  const statusFn = vi.fn((c: number) => {
    code = c;
    return { send: sendFn };
  });

  const reply = { status: statusFn } as unknown as Parameters<
    typeof verifyWebhookSignature
  >[1];

  return {
    reply,
    statusCode: () => code,
    sentPayload: () => payload,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('verifyWebhookSignature middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 404 when bank account does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const request = makeRequest({ bankAccountId: 'non-existent-id' });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(404);
    expect(sentPayload()).toEqual({ message: 'Bank account not found' });
  });

  it('passes through when no secret is configured (backwards-compatible)', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: null,
      tenantId: 'tenant-1',
    });

    const request = makeRequest({});
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    // No status set — middleware passed through
    expect(statusCode()).toBeUndefined();
    // tenantId was attached to the request
    expect((request as Record<string, unknown>).bankAccountTenantId).toBe(
      'tenant-1',
    );
  });

  it('attaches bankAccountTenantId to request even when secret is null', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: null,
      tenantId: 'tenant-abc',
    });

    const request = makeRequest({});
    const { reply } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect((request as Record<string, unknown>).bankAccountTenantId).toBe(
      'tenant-abc',
    );
  });

  it('passes through when signature matches (x-webhook-signature header)', async () => {
    const secret = 'my-super-secret';
    const body = { event: 'PIX_RECEIVED', amount: 250 };
    const sig = makeSignature(secret, body);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-2',
    });

    const request = makeRequest({
      headers: { 'x-webhook-signature': sig },
      body,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBeUndefined();
    expect((request as Record<string, unknown>).bankAccountTenantId).toBe(
      'tenant-2',
    );
  });

  it('passes through when signature matches (x-sicoob-signature header)', async () => {
    const secret = 'sicoob-secret-key';
    const body = { event: 'BOLETO_PAID', value: 500 };
    const sig = makeSignature(secret, body);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-3',
    });

    const request = makeRequest({
      headers: { 'x-sicoob-signature': sig },
      body,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBeUndefined();
  });

  it('passes through when signature matches (webhook-signature header)', async () => {
    const secret = 'fallback-secret';
    const body = { event: 'TED_RECEIVED' };
    const sig = makeSignature(secret, body);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-4',
    });

    const request = makeRequest({
      headers: { 'webhook-signature': sig },
      body,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBeUndefined();
  });

  it('returns 401 when signature header is missing but secret is configured', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: 'some-secret',
      tenantId: 'tenant-5',
    });

    const request = makeRequest({ headers: {} });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({
      message: 'Missing webhook signature header',
    });
  });

  it('returns 401 when signature does not match', async () => {
    const secret = 'correct-secret';

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-6',
    });

    const request = makeRequest({
      headers: { 'x-webhook-signature': 'deadbeefdeadbeef' },
      body: { event: 'PIX_RECEIVED' },
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });

  it('returns 401 when signature is for different body (tampered payload)', async () => {
    const secret = 'signing-secret';
    const originalBody = { event: 'PIX_RECEIVED', amount: 100 };
    const tamperedBody = { event: 'PIX_RECEIVED', amount: 99999 };
    const sig = makeSignature(secret, originalBody);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-7',
    });

    const request = makeRequest({
      headers: { 'x-webhook-signature': sig },
      body: tamperedBody,
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });
});
