import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

async function createEmployee(token: string) {
  const res = await request(app.server)
    .post('/v1/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send(generateEmployeeData());
  return res.body.employee as { id: string };
}

describe('Rotate QR Tokens Bulk (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('returns 403 for user without hr.punch-devices.admin permission', async () => {
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const res = await request(app.server)
      .post('/v1/hr/qr-tokens/rotate-bulk')
      .set('Authorization', `Bearer ${unauthorized.token}`)
      .send({ scope: 'ALL', generatePdfs: false });
    expect(res.status).toBe(403);
  });

  // Skipped under the current E2E harness because the bulk enqueue path
  // requires a live Redis server (BullMQ `addJob` blocks on a connection).
  // The happy-path is covered in the unit spec for RotateQrTokensBulkUseCase
  // which mocks `addJob`. Re-enable once the Phase 5 E2E infra ships with
  // Redis by default (tracked via the E2E infra notes in MEMORY.md).
  it.skip('scope=CUSTOM → 202 with { jobId, total, generatePdfs } (needs Redis)', async () => {
    const a = await createEmployee(token);
    const b = await createEmployee(token);

    const res = await request(app.server)
      .post('/v1/hr/qr-tokens/rotate-bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: 'CUSTOM',
        employeeIds: [a.id, b.id],
        generatePdfs: false,
      });

    expect(res.status).toBe(202);
    expect(res.body.total).toBe(2);
    expect(res.body.generatePdfs).toBe(false);
    expect(typeof res.body.jobId).toBe('string');
    expect(res.body.jobId).toMatch(/^[a-f0-9]{16}$/);
  });

  it('scope=CUSTOM returns jobId=null when all provided ids belong to other tenants', async () => {
    const res = await request(app.server)
      .post('/v1/hr/qr-tokens/rotate-bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({
        scope: 'CUSTOM',
        employeeIds: ['00000000-0000-0000-0000-000000000000'],
        generatePdfs: false,
      });

    expect(res.status).toBe(202);
    expect(res.body.total).toBe(0);
    expect(res.body.jobId).toBeNull();
  });

  it('rejects body with scope=CUSTOM and empty employeeIds (400)', async () => {
    const res = await request(app.server)
      .post('/v1/hr/qr-tokens/rotate-bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ scope: 'CUSTOM', employeeIds: [], generatePdfs: false });

    expect(res.status).toBe(400);
  });

  // NOTE: cancel endpoint requires a live Redis connection to look up the
  // BullMQ job. Its happy path and "job not found" → ResourceNotFoundError
  // behavior are covered in the unit spec for CancelQrRotationBulkUseCase
  // (which mocks `createQueue`). E2E coverage is deferred until the Phase 5
  // worktree has a stable BullMQ test harness.
});
