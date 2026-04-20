import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Hoisted mocks — MUST be declared via vi.hoisted so vi.mock() factories can
// reference them (factories are lifted above imports in vitest).
// ---------------------------------------------------------------------------

const mocks = vi.hoisted(() => ({
  createWorkerMock: vi.fn(),
  addJobMock: vi.fn(),
  transactionMock: vi.fn(),
  updateManyMock: vi.fn(),
  publishMock: vi.fn(),
  emitMock: vi.fn(),
  getSocketServerMock: vi.fn(),
  updateProgressMock: vi.fn(),
  getJobDataMock: vi.fn(),
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
    $transaction: (cb: (tx: unknown) => unknown) => mocks.transactionMock(cb),
    employee: {
      updateMany: (...args: unknown[]) => mocks.updateManyMock(...args),
    },
  },
}));

vi.mock('@/lib/events/typed-event-bus', () => ({
  getTypedEventBus: () => ({ publish: mocks.publishMock }),
}));

vi.mock('@/lib/websocket/socket-server', () => ({
  getSocketServer: mocks.getSocketServerMock,
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: mocks.loggerInfoMock,
    warn: vi.fn(),
    error: mocks.loggerErrorMock,
    debug: vi.fn(),
  },
}));

const { startQrBatchWorker } = await import('./qr-batch-worker');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildFakeJob(
  overrides: {
    id?: string;
    tenantId?: string;
    employeeIds?: string[];
    generatePdfs?: boolean;
    invokedByUserId?: string;
    cancelled?: boolean;
  } = {},
) {
  const data = {
    tenantId: overrides.tenantId ?? 'tenant-1',
    employeeIds: overrides.employeeIds ?? ['e1', 'e2', 'e3'],
    generatePdfs: overrides.generatePdfs ?? false,
    invokedByUserId: overrides.invokedByUserId ?? 'admin-01',
    cancelled: overrides.cancelled ?? false,
  };
  mocks.getJobDataMock.mockImplementation(async () => data);

  return {
    id: overrides.id ?? 'job-1',
    data,
    updateProgress: mocks.updateProgressMock,
    getState: vi.fn().mockResolvedValue('active'),
    getData: mocks.getJobDataMock,
  };
}

beforeEach(() => {
  Object.values(mocks).forEach((m) => m.mockReset && m.mockReset());

  mocks.createWorkerMock.mockReturnValue({
    close: vi.fn().mockResolvedValue(undefined),
  });
  mocks.transactionMock.mockImplementation(
    async (cb: (tx: unknown) => unknown) => {
      // tx exposes the same shape as prisma for our usage
      const tx = {
        employee: {
          updateMany: (...args: unknown[]) => mocks.updateManyMock(...args),
        },
      };
      return cb(tx);
    },
  );
  mocks.updateManyMock.mockResolvedValue({ count: 1 });
  mocks.publishMock.mockResolvedValue(undefined);
  mocks.addJobMock.mockResolvedValue({ id: 'sub-job' });
  mocks.getSocketServerMock.mockReturnValue({
    to: () => ({ emit: mocks.emitMock }),
  });
});

describe('qrBatchWorker', () => {
  it('registers against QUEUE_NAMES.QR_BATCH with conservative concurrency', () => {
    startQrBatchWorker();

    expect(mocks.createWorkerMock).toHaveBeenCalledTimes(1);
    const [queueName, , opts] = mocks.createWorkerMock.mock.calls[0];
    expect(queueName).toBe('qr-batch-operations');
    expect(opts.concurrency).toBe(1);
  });

  it('processes employees in one chunk when total <= CHUNK size, persisting each via updateMany', async () => {
    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    const job = buildFakeJob({ employeeIds: ['e1', 'e2', 'e3'] });
    const result = await handler(job as never);

    expect(result).toEqual({ processed: 3, total: 3 });
    expect(mocks.transactionMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateManyMock).toHaveBeenCalledTimes(3);

    // Assert each call used the employeeId, tenantId and a sha256-shaped hash
    const calls = mocks.updateManyMock.mock.calls;
    for (const [arg] of calls) {
      expect((arg as { where: { tenantId: string } }).where.tenantId).toBe(
        'tenant-1',
      );
      const data = (arg as { data: { qrTokenHash: string } }).data;
      expect(data.qrTokenHash).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('reports progress via job.updateProgress + Socket.IO tenant room', async () => {
    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    const job = buildFakeJob({ employeeIds: ['e1', 'e2'] });
    await handler(job as never);

    expect(mocks.updateProgressMock).toHaveBeenCalledTimes(1);
    expect(mocks.updateProgressMock).toHaveBeenCalledWith(
      expect.objectContaining({ processed: 2, total: 2, percent: 100 }),
    );

    expect(mocks.emitMock).toHaveBeenCalledWith(
      'punch.qr_rotation.progress',
      expect.objectContaining({
        jobId: 'job-1',
        processed: 2,
        total: 2,
      }),
    );
  });

  it('passes a tenant-scoped Socket.IO room name', async () => {
    const toSpy = vi.fn(() => ({ emit: mocks.emitMock }));
    mocks.getSocketServerMock.mockReturnValue({ to: toSpy });

    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(buildFakeJob() as never);

    expect(toSpy).toHaveBeenCalledWith('tenant:tenant-1:hr');
  });

  it('publishes PUNCH_EVENTS.QR_ROTATION_COMPLETED at the end with processed/total', async () => {
    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(buildFakeJob({ employeeIds: ['e1', 'e2'] }) as never);

    expect(mocks.publishMock).toHaveBeenCalledTimes(1);
    const published = mocks.publishMock.mock.calls[0][0];
    expect(published.type).toBe('punch.qr.rotation.completed');
    expect(published.tenantId).toBe('tenant-1');
    expect(published.data).toMatchObject({
      jobId: 'job-1',
      tenantId: 'tenant-1',
      invokedByUserId: 'admin-01',
      processed: 2,
      total: 2,
      generatedPdfs: false,
    });
  });

  it('enqueues a BADGE_PDF sub-job when generatePdfs=true, with deterministic jobId `badge-{jobId}` and the rotated tokens array', async () => {
    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(
      buildFakeJob({
        employeeIds: ['e1', 'e2'],
        generatePdfs: true,
      }) as never,
    );

    expect(mocks.addJobMock).toHaveBeenCalledTimes(1);
    const [queueName, payload, opts] = mocks.addJobMock.mock.calls[0];
    expect(queueName).toBe('badge-pdf-generation');
    expect(opts.jobId).toBe('badge-job-1');
    expect(payload.scope).toBe('CUSTOM');
    expect(payload.tenantId).toBe('tenant-1');
    expect(payload.parentJobId).toBe('job-1');
    expect(payload.employeeIds).toEqual(['e1', 'e2']);
    expect(payload.invokedByUserId).toBe('admin-01');
    expect(payload.tokens).toHaveLength(2);
    for (const t of payload.tokens) {
      expect(t.employeeId).toEqual(expect.any(String));
      expect(t.token).toMatch(/^[a-f0-9]{64}$/);
    }
  });

  it('does NOT enqueue a BADGE_PDF sub-job when generatePdfs=false', async () => {
    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    await handler(buildFakeJob({ generatePdfs: false }) as never);

    expect(mocks.addJobMock).not.toHaveBeenCalled();
  });

  it('respects cooperative cancellation: when job.getData returns cancelled=true between chunks, no further chunk processes', async () => {
    startQrBatchWorker();
    const [, handler] = mocks.createWorkerMock.mock.calls[0];

    // Prepare a 150-id job so we naturally have 2 chunks.
    const ids = Array.from({ length: 150 }, (_, i) => `e${i}`);
    const jobData = {
      tenantId: 'tenant-1',
      employeeIds: ids,
      generatePdfs: false,
      invokedByUserId: 'admin-01',
      cancelled: false,
    };

    // First call returns original data; second call (before chunk 2) returns
    // cancelled=true.
    mocks.getJobDataMock
      .mockResolvedValueOnce(jobData)
      .mockResolvedValueOnce({ ...jobData, cancelled: true });

    const fakeJob = {
      id: 'big-job',
      data: jobData,
      updateProgress: mocks.updateProgressMock,
      getState: vi.fn().mockResolvedValue('active'),
      getData: mocks.getJobDataMock,
    };

    const result = await handler(fakeJob as never);

    // Exactly one chunk (100) processed before cancellation observed.
    expect(result.processed).toBe(100);
    expect(result.total).toBe(150);
  });
});
