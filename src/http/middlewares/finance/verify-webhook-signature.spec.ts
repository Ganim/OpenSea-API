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

function makeSignatureFromRaw(secret: string, rawBody: string): string {
  return createHmac('sha256', secret).update(rawBody).digest('hex');
}

function makeRequest(overrides: {
  bankAccountId?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  rawBody?: string;
}): Parameters<typeof verifyWebhookSignature>[0] {
  const parsedBody = overrides.body ?? { event: 'PIX_RECEIVED', amount: 100 };
  const rawBody = overrides.rawBody ?? JSON.stringify(parsedBody);

  // Minimal Fastify-compatible logger stub. Several code paths use
  // request.log.warn / request.log.error and would otherwise throw.
  const log = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    fatal: vi.fn(),
    trace: vi.fn(),
    child: vi.fn(),
  };

  return {
    query: { bankAccountId: overrides.bankAccountId ?? 'test-account-id' },
    headers: overrides.headers ?? {},
    body: parsedBody,
    rawBody,
    log,
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

  it('returns 503 when no secret is configured (fail-closed)', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: null,
      tenantId: 'tenant-1',
    });

    const request = makeRequest({});
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(503);
    expect(sentPayload()).toEqual({
      message: 'Webhook secret not configured for this tenant',
    });
    // tenantId is still attached for downstream observability
    expect(
      (request as unknown as Record<string, unknown>).bankAccountTenantId,
    ).toBe('tenant-1');
  });

  it('returns 503 when secret is empty string', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: '',
      tenantId: 'tenant-empty',
    });

    const request = makeRequest({});
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(503);
  });

  it('attaches bankAccountTenantId to request even when secret is null', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: null,
      tenantId: 'tenant-abc',
    });

    const request = makeRequest({});
    const { reply } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(
      (request as unknown as Record<string, unknown>).bankAccountTenantId,
    ).toBe('tenant-abc');
  });

  it('passes through when signature matches over the raw body (x-webhook-signature header)', async () => {
    const secret = 'my-super-secret';
    const rawBody = '{"event":"PIX_RECEIVED","amount":250}';
    const sig = makeSignatureFromRaw(secret, rawBody);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-2',
    });

    const request = makeRequest({
      headers: { 'x-webhook-signature': sig },
      body: { event: 'PIX_RECEIVED', amount: 250 },
      rawBody,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBeUndefined();
    expect(
      (request as unknown as Record<string, unknown>).bankAccountTenantId,
    ).toBe('tenant-2');
  });

  it('passes through when signature matches (x-sicoob-signature header)', async () => {
    const secret = 'sicoob-secret-key';
    const rawBody = '{"event":"BOLETO_PAID","value":500}';
    const sig = makeSignatureFromRaw(secret, rawBody);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-3',
    });

    const request = makeRequest({
      headers: { 'x-sicoob-signature': sig },
      body: { event: 'BOLETO_PAID', value: 500 },
      rawBody,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBeUndefined();
  });

  it('passes through when signature matches (webhook-signature header)', async () => {
    const secret = 'fallback-secret';
    const rawBody = '{"event":"TED_RECEIVED"}';
    const sig = makeSignatureFromRaw(secret, rawBody);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-4',
    });

    const request = makeRequest({
      headers: { 'webhook-signature': sig },
      body: { event: 'TED_RECEIVED' },
      rawBody,
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
    const originalRaw = '{"event":"PIX_RECEIVED","amount":100}';
    const tamperedRaw = '{"event":"PIX_RECEIVED","amount":99999}';
    const sig = makeSignatureFromRaw(secret, originalRaw);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-7',
    });

    const request = makeRequest({
      headers: { 'x-webhook-signature': sig },
      body: { event: 'PIX_RECEIVED', amount: 99999 },
      rawBody: tamperedRaw,
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });

  // Regression test for P0-19: HMAC must be computed over the raw byte-stream
  // Sicoob signed, NOT over a re-serialized JSON. Two payloads can be
  // semantically equivalent (same keys, same values) yet produce different
  // signatures because Sicoob signs key order, whitespace, etc. The middleware
  // must reject the request whose raw body does not match the signature even
  // when the parsed body has been "re-ordered" (e.g. by Fastify's JSON parser).
  it('validates signature against raw body even when parsed body keys are reordered', async () => {
    const secret = 'sicoob-secret-2026';
    // Sicoob sends this exact byte-stream and signs it
    const rawBody = '{"amount":100,"event":"PIX_RECEIVED","txId":"abc"}';
    const sig = makeSignatureFromRaw(secret, rawBody);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-rawbody',
    });

    // Fastify parsed the body and re-stringifying it would yield a different
    // key order. The middleware must still validate against the raw bytes.
    const reorderedParsedBody = {
      txId: 'abc',
      event: 'PIX_RECEIVED',
      amount: 100,
    };

    const request = makeRequest({
      headers: { 'x-sicoob-signature': sig },
      body: reorderedParsedBody,
      rawBody,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    // Signature must match because we hash the raw body, not the parsed one.
    expect(statusCode()).toBeUndefined();
  });

  it('rejects signature computed over re-serialized parsed body (anti-regression)', async () => {
    const secret = 'sicoob-secret-2026';
    const reorderedParsedBody = {
      txId: 'abc',
      event: 'PIX_RECEIVED',
      amount: 100,
    };
    // Sign what JSON.stringify(parsed) would produce — this should NOT match
    // because the actual transmitted bytes had a different key order.
    const sigFromReordered = makeSignatureFromRaw(
      secret,
      JSON.stringify(reorderedParsedBody),
    );
    const actualRawBody =
      '{"amount":100,"event":"PIX_RECEIVED","txId":"abc"}';

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-rawbody-2',
    });

    const request = makeRequest({
      headers: { 'x-sicoob-signature': sigFromReordered },
      body: reorderedParsedBody,
      rawBody: actualRawBody,
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });

  // P2-50 (a): timing attack surface. The middleware uses timingSafeEqual,
  // which requires both buffers to be the same length. A signature that
  // hex-decodes to a different length must be rejected WITHOUT falling
  // through to a byte-by-byte loose equality check.
  it('rejects signatures whose decoded length differs from the expected length (timing-attack guard)', async () => {
    const secret = 'timing-secret';
    const rawBody = '{"event":"PIX_RECEIVED","amount":1}';

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-timing',
    });

    // Valid HMAC-SHA256 is 64 hex chars → 32 bytes. A 2-byte signature
    // would fail any byte-wise early-return loose compare that peeks
    // the first byte, but timingSafeEqual aborts on length mismatch.
    const tooShortSig = 'ab';

    const request = makeRequest({
      headers: { 'x-webhook-signature': tooShortSig },
      body: { event: 'PIX_RECEIVED', amount: 1 },
      rawBody,
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });

  it('rejects signatures with non-hex characters without leaking the expected length', async () => {
    const secret = 'timing-secret';
    const rawBody = '{"event":"PIX_RECEIVED","amount":1}';

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-timing-2',
    });

    // Garbage signature (letters outside 0-9a-f). Buffer.from('zz...', 'hex')
    // yields an empty buffer rather than throwing, so the length mismatch
    // path in the middleware must still reject this as 401, not 500.
    const garbageSig = 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz';

    const request = makeRequest({
      headers: { 'x-webhook-signature': garbageSig },
      body: { event: 'PIX_RECEIVED', amount: 1 },
      rawBody,
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });

  // P2-50 (b): raw body preservation. If the middleware ever regressed
  // to JSON.stringify(request.body), the signature would match even
  // though the bytes Sicoob signed are different. This pins the contract
  // that request.body is NEVER used to compute the HMAC.
  it('must not use request.body as fallback when rawBody is present', async () => {
    const secret = 'rawbody-secret';

    // Bytes Sicoob actually signed — includes trailing whitespace, which
    // JSON.stringify(parsed) would strip.
    const rawBody = '{"event":"PIX_RECEIVED","amount":1}   ';
    const validSig = makeSignatureFromRaw(secret, rawBody);

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-rawbody-preserve',
    });

    // Parsed body is the canonical form without whitespace
    const parsedBody = { event: 'PIX_RECEIVED', amount: 1 };

    const request = makeRequest({
      headers: { 'x-webhook-signature': validSig },
      body: parsedBody,
      rawBody, // exact bytes signed
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    // Signature must pass because the middleware hashed rawBody, not
    // JSON.stringify(parsedBody). If it had used the parsed body, the
    // whitespace difference would have caused a 401.
    expect(statusCode()).toBeUndefined();
  });

  // P3-26 / P3-36: GitHub-style and Pluggy sandbox webhooks prefix the hex
  // digest with "sha256=". The middleware must accept both the bare digest
  // and the prefixed form so we don't reject legitimate provider requests.
  it('accepts signature header prefixed with "sha256=" (GitHub-style convention)', async () => {
    const secret = 'prefixed-secret';
    const rawBody = '{"event":"PIX_RECEIVED","amount":321}';
    const bareDigest = makeSignatureFromRaw(secret, rawBody);
    const prefixedDigest = `sha256=${bareDigest}`;

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-prefixed',
    });

    const request = makeRequest({
      headers: { 'x-webhook-signature': prefixedDigest },
      body: { event: 'PIX_RECEIVED', amount: 321 },
      rawBody,
    });
    const { reply, statusCode } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBeUndefined();
  });

  it('rejects signature with "sha256=" prefix but invalid digest', async () => {
    const secret = 'prefixed-secret-2';
    const rawBody = '{"event":"PIX_RECEIVED","amount":1}';

    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: secret,
      tenantId: 'tenant-prefixed-bad',
    });

    // Valid prefix but forged digest — must still be rejected
    const forgedPrefixed = `sha256=${'0'.repeat(64)}`;

    const request = makeRequest({
      headers: { 'x-webhook-signature': forgedPrefixed },
      body: { event: 'PIX_RECEIVED', amount: 1 },
      rawBody,
    });
    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(401);
    expect(sentPayload()).toEqual({ message: 'Invalid webhook signature' });
  });

  it('returns 500 when raw body is missing (plugin not registered for this route)', async () => {
    mockFindUnique.mockResolvedValue({
      apiWebhookSecret: 'some-secret',
      tenantId: 'tenant-no-raw',
    });

    const sig = makeSignatureFromRaw('some-secret', '{"event":"X"}');

    // Build a request without rawBody (simulates routes where the plugin
    // wasn't enabled — fail closed instead of falling back to JSON.stringify).
    const log = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      fatal: vi.fn(),
      trace: vi.fn(),
      child: vi.fn(),
    };
    const request = {
      query: { bankAccountId: 'test-account-id' },
      headers: { 'x-webhook-signature': sig },
      body: { event: 'X' },
      log,
    } as unknown as Parameters<typeof verifyWebhookSignature>[0];

    const { reply, statusCode, sentPayload } = makeReply();

    await verifyWebhookSignature(request, reply);

    expect(statusCode()).toBe(500);
    expect(sentPayload()).toEqual({
      message: 'Webhook raw body capture is not configured',
    });
  });
});
