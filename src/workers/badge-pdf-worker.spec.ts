import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks — factories lifted above imports so the `vi.mock` blocks
// below can reference the shared handles. Mirrors qr-batch-worker.spec.ts.
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  createWorkerMock: vi.fn(),
  addJobMock: vi.fn(),
  renderA4BadgeSheetMock: vi.fn(),
  tenantFindUniqueMock: vi.fn(),
  employeeFindManyMock: vi.fn(),
  employeeUpdateManyMock: vi.fn(),
  publishMock: vi.fn(),
  emitMock: vi.fn(),
  getSocketServerMock: vi.fn(),
  redisSetMock: vi.fn(),
  s3SendMock: vi.fn(),
  getSignedUrlMock: vi.fn(),
  loggerInfoMock: vi.fn(),
  loggerErrorMock: vi.fn(),
}));

vi.mock('@/lib/queue', () => ({
  QUEUE_NAMES: {
    QR_BATCH: 'qr-batch-operations',
    BADGE_PDF: 'badge-pdf-generation',
  },
  createWorker: mocks.createWorkerMock,
  addJob: mocks.addJobMock,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenant: {
      findUnique: (...args: unknown[]) => mocks.tenantFindUniqueMock(...args),
    },
    employee: {
      findMany: (...args: unknown[]) => mocks.employeeFindManyMock(...args),
      updateMany: (...args: unknown[]) => mocks.employeeUpdateManyMock(...args),
    },
  },
}));

vi.mock('@/lib/pdf/badge-pdf-renderer', () => ({
  renderA4BadgeSheet: mocks.renderA4BadgeSheetMock,
}));

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({ publish: mocks.publishMock }),
}));

vi.mock('@/lib/websocket/socket-server', () => ({
  getSocketServer: mocks.getSocketServerMock,
}));

vi.mock('@/lib/redis', () => ({
  redis: {
    client: {
      set: (...args: unknown[]) => mocks.redisSetMock(...args),
    },
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfoMock,
    warn: vi.fn(),
    error: mocks.loggerErrorMock,
    debug: vi.fn(),
  },
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn().mockImplementation(() => ({ send: mocks.s3SendMock })),
  PutObjectCommand: vi
    .fn()
    .mockImplementation((args) => ({ __cmd: 'Put', args })),
  GetObjectCommand: vi
    .fn()
    .mockImplementation((args) => ({ __cmd: 'Get', args })),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mocks.getSignedUrlMock(...args),
}));

const { startBadgePdfWorker } = await import('./badge-pdf-worker');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFakeJob(
  overrides: {
    id?: string;
    tenantId?: string;
    employeeIds?: string[];
    invokedByUserId?: string;
    rotateTokens?: boolean;
    tokens?: Array<{ employeeId: string; token: string }>;
    parentJobId?: string;
  } = {},
) {
  const data = {
    tenantId: overrides.tenantId ?? 'tenant-1',
    scope: 'CUSTOM' as const,
    employeeIds: overrides.employeeIds ?? ['e1', 'e2'],
    invokedByUserId: overrides.invokedByUserId ?? 'admin-01',
    rotateTokens: overrides.rotateTokens,
    tokens: overrides.tokens,
    parentJobId: overrides.parentJobId,
  };
  return {
    id: overrides.id ?? 'bp-1',
    data,
    updateProgress: vi.fn(),
    getState: vi.fn().mockResolvedValue('active'),
  };
}

function seedTenant(extra: { brandColor?: string } = {}) {
  mocks.tenantFindUniqueMock.mockResolvedValue({
    id: 'tenant-1',
    name: 'Empresa Demo',
    logoUrl: null,
    settings: extra.brandColor ? { brandColor: extra.brandColor } : {},
  });
}

function seedEmployees(ids: string[]) {
  mocks.employeeFindManyMock.mockResolvedValue(
    ids.map((id) => ({
      id,
      fullName: `Funcionário ${id}`,
      socialName: null,
      registrationNumber: `REG-${id}`,
      photoUrl: null,
    })),
  );
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset && m.mockReset());

  mocks.createWorkerMock.mockReturnValue({
    close: vi.fn().mockResolvedValue(undefined),
  });
  mocks.renderA4BadgeSheetMock.mockResolvedValue(Buffer.from('PDF-BYTES'));
  mocks.employeeUpdateManyMock.mockResolvedValue({ count: 1 });
  mocks.publishMock.mockResolvedValue(undefined);
  mocks.getSocketServerMock.mockReturnValue({
    to: () => ({ emit: mocks.emitMock }),
  });
  mocks.redisSetMock.mockResolvedValue('OK');
  mocks.s3SendMock.mockResolvedValue({});
  mocks.getSignedUrlMock.mockResolvedValue(
    'https://s3.example.com/badge-pdfs/tenant-1/bp-1.pdf?X-Amz=signed',
  );

  // Default: no S3 env → redis fallback path
  delete process.env.S3_BUCKET;
  delete process.env.S3_REGION;
  delete process.env.S3_ENDPOINT;
  delete process.env.S3_ACCESS_KEY_ID;
  delete process.env.S3_SECRET_ACCESS_KEY;
});

describe('badgePdfWorker', () => {
  it('registers against QUEUE_NAMES.BADGE_PDF with single-flight concurrency', () => {
    startBadgePdfWorker();
    expect(mocks.createWorkerMock).toHaveBeenCalledTimes(1);
    const [queueName, , opts] = mocks.createWorkerMock.mock.calls[0];
    expect(queueName).toBe('badge-pdf-generation');
    expect(opts.concurrency).toBe(1);
  });

  it('when payload.tokens is supplied (qr-batch sub-job), uses them directly without rotating', async () => {
    seedTenant();
    seedEmployees(['e1', 'e2']);

    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    const providedTokens = [
      { employeeId: 'e1', token: 'a'.repeat(64) },
      { employeeId: 'e2', token: 'b'.repeat(64) },
    ];

    await handler(
      buildFakeJob({
        employeeIds: ['e1', 'e2'],
        tokens: providedTokens,
      }) as never,
    );

    // No rotation happened — updateMany NEVER called.
    expect(mocks.employeeUpdateManyMock).not.toHaveBeenCalled();
    // renderA4BadgeSheet received the supplied tokens.
    const [cards] = mocks.renderA4BadgeSheetMock.mock.calls[0];
    expect(cards).toHaveLength(2);
    expect(cards[0].qrToken).toBe('a'.repeat(64));
    expect(cards[1].qrToken).toBe('b'.repeat(64));
  });

  it('when rotateTokens=true and tokens absent, rotates each employee inline (randomBytes + sha256)', async () => {
    seedTenant();
    seedEmployees(['e1', 'e2', 'e3']);

    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(
      buildFakeJob({
        employeeIds: ['e1', 'e2', 'e3'],
        rotateTokens: true,
      }) as never,
    );

    expect(mocks.employeeUpdateManyMock).toHaveBeenCalledTimes(3);
    for (const [arg] of mocks.employeeUpdateManyMock.mock.calls) {
      expect((arg as { where: { tenantId: string } }).where.tenantId).toBe(
        'tenant-1',
      );
      const data = (arg as { data: { qrTokenHash: string } }).data;
      expect(data.qrTokenHash).toMatch(/^[a-f0-9]{64}$/);
    }
    // Each card's qrToken is the 64-hex plaintext that was rotated.
    const [cards] = mocks.renderA4BadgeSheetMock.mock.calls[0];
    expect(cards).toHaveLength(3);
    for (const c of cards) {
      expect(c.qrToken).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('throws when rotateTokens=false and tokens array is absent/empty', async () => {
    seedTenant();
    seedEmployees(['e1']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await expect(
      handler(
        buildFakeJob({
          employeeIds: ['e1'],
          rotateTokens: false,
          tokens: [],
        }) as never,
      ),
    ).rejects.toThrow(/Payload missing tokens/);
  });

  it('uses Redis fallback when S3 env vars are absent, returning /v1/hr/qr-tokens/bulk-pdf/:jobId/download', async () => {
    seedTenant();
    seedEmployees(['e1']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    const result = await handler(
      buildFakeJob({
        id: 'bp-42',
        employeeIds: ['e1'],
        tokens: [{ employeeId: 'e1', token: 'c'.repeat(64) }],
      }) as never,
    );

    expect(mocks.redisSetMock).toHaveBeenCalledTimes(1);
    const [key, buf, mode, ttl] = mocks.redisSetMock.mock.calls[0];
    expect(key).toBe('badge-pdf:bp-42');
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(mode).toBe('EX');
    expect(ttl).toBe(86400);

    expect(result).toMatchObject({
      downloadUrl: '/v1/hr/qr-tokens/bulk-pdf/bp-42/download',
      cardCount: 1,
    });
  });

  it('uses S3 primary path (PutObject + 24h pre-signed URL) when S3 env is configured', async () => {
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_ACCESS_KEY_ID = 'key';
    process.env.S3_SECRET_ACCESS_KEY = 'secret';

    seedTenant();
    seedEmployees(['e1']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    const result = await handler(
      buildFakeJob({
        id: 'bp-s3',
        employeeIds: ['e1'],
        tokens: [{ employeeId: 'e1', token: 'd'.repeat(64) }],
      }) as never,
    );

    // Put was called with the tenant-scoped key.
    expect(mocks.s3SendMock).toHaveBeenCalledTimes(1);
    const sentCommand = mocks.s3SendMock.mock.calls[0][0];
    expect(sentCommand.args.Bucket).toBe('test-bucket');
    expect(sentCommand.args.Key).toBe('badge-pdfs/tenant-1/bp-s3.pdf');
    expect(sentCommand.args.ContentType).toBe('application/pdf');

    // getSignedUrl was called with expiresIn=86400 (24h per D-13).
    const [, , opts] = mocks.getSignedUrlMock.mock.calls[0];
    expect(opts.expiresIn).toBe(86400);

    expect(result.downloadUrl).toMatch(/^https:\/\/s3\.example\.com\//);
    expect(mocks.redisSetMock).not.toHaveBeenCalled();
  });

  it('falls back to Redis when S3 upload throws (graceful degrade)', async () => {
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_REGION = 'us-east-1';
    process.env.S3_ENDPOINT = 'https://s3.example.com';
    process.env.S3_ACCESS_KEY_ID = 'key';
    process.env.S3_SECRET_ACCESS_KEY = 'secret';

    mocks.s3SendMock.mockRejectedValueOnce(new Error('S3 outage'));

    seedTenant();
    seedEmployees(['e1']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    const result = await handler(
      buildFakeJob({
        id: 'bp-degrade',
        employeeIds: ['e1'],
        tokens: [{ employeeId: 'e1', token: 'e'.repeat(64) }],
      }) as never,
    );

    expect(mocks.redisSetMock).toHaveBeenCalledTimes(1);
    expect(result.downloadUrl).toBe(
      '/v1/hr/qr-tokens/bulk-pdf/bp-degrade/download',
    );
    // The worker's `getLogger()` uses `require(...)` which bypasses vitest's
    // ESM mock layer; the lazy fallback emits to console.error instead. The
    // behavioural contract (fallback to Redis) is already asserted above.
  });

  it('publishes PUNCH_EVENTS.QR_ROTATION_COMPLETED with bulkPdfDownloadUrl at the end', async () => {
    seedTenant();
    seedEmployees(['e1', 'e2']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(
      buildFakeJob({
        employeeIds: ['e1', 'e2'],
        tokens: [
          { employeeId: 'e1', token: 'a'.repeat(64) },
          { employeeId: 'e2', token: 'b'.repeat(64) },
        ],
      }) as never,
    );

    expect(mocks.publishMock).toHaveBeenCalledTimes(1);
    const published = mocks.publishMock.mock.calls[0][0];
    expect(published.type).toBe('punch.qr.rotation.completed');
    expect(published.tenantId).toBe('tenant-1');
    expect(published.data).toMatchObject({
      jobId: 'bp-1',
      tenantId: 'tenant-1',
      invokedByUserId: 'admin-01',
      processed: 2,
      total: 2,
      generatedPdfs: true,
    });
    expect(published.data.bulkPdfDownloadUrl).toBeTruthy();
  });

  it('uses tenant brandColor when settings.brandColor is present, otherwise defaults to #2563EB', async () => {
    mocks.tenantFindUniqueMock.mockResolvedValueOnce({
      id: 'tenant-1',
      name: 'Empresa Demo',
      logoUrl: null,
      settings: { brandColor: '#FF00AA' },
    });
    seedEmployees(['e1']);

    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(
      buildFakeJob({
        employeeIds: ['e1'],
        tokens: [{ employeeId: 'e1', token: 'a'.repeat(64) }],
      }) as never,
    );

    const [cards] = mocks.renderA4BadgeSheetMock.mock.calls[0];
    expect(cards[0].tenantBrandColor).toBe('#FF00AA');

    // Next run without brandColor → default.
    mocks.tenantFindUniqueMock.mockResolvedValueOnce({
      id: 'tenant-1',
      name: 'Empresa Demo',
      logoUrl: null,
      settings: {},
    });
    seedEmployees(['e1']);
    mocks.renderA4BadgeSheetMock.mockClear();

    await handler(
      buildFakeJob({
        id: 'bp-2',
        employeeIds: ['e1'],
        tokens: [{ employeeId: 'e1', token: 'a'.repeat(64) }],
      }) as never,
    );
    const [cardsDefault] = mocks.renderA4BadgeSheetMock.mock.calls[0];
    expect(cardsDefault[0].tenantBrandColor).toBe('#2563EB');
  });

  it('emits Socket.IO progress ping on the tenant:{id}:hr room (best-effort)', async () => {
    const toSpy = vi.fn(() => ({ emit: mocks.emitMock }));
    mocks.getSocketServerMock.mockReturnValue({ to: toSpy });

    seedTenant();
    seedEmployees(['e1']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(
      buildFakeJob({
        employeeIds: ['e1'],
        tokens: [{ employeeId: 'e1', token: 'f'.repeat(64) }],
      }) as never,
    );

    expect(toSpy).toHaveBeenCalledWith('tenant:tenant-1:hr');
    expect(mocks.emitMock).toHaveBeenCalledWith(
      'punch.badge_pdf.progress',
      expect.objectContaining({ processed: 1, total: 1, percent: 100 }),
    );
  });

  it('throws when tenant is not found', async () => {
    mocks.tenantFindUniqueMock.mockResolvedValueOnce(null);
    seedEmployees(['e1']);
    startBadgePdfWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await expect(
      handler(
        buildFakeJob({
          employeeIds: ['e1'],
          tokens: [{ employeeId: 'e1', token: 'f'.repeat(64) }],
        }) as never,
      ),
    ).rejects.toThrow(/Tenant .* not found/);
  });
});
