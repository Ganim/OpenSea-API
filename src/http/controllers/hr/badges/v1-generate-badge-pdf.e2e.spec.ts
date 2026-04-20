import { createHash } from 'node:crypto';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

async function createEmployee(token: string) {
  const res = await request(app.server)
    .post('/v1/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send(generateEmployeeData());
  return res.body.employee as { id: string; fullName: string };
}

/**
 * E2E coverage for POST /v1/hr/employees/:id/badge-pdf (Plan 05-06 Task 3).
 *
 * The controller synchronously rotates the employee's QR token and streams
 * a pdfkit-rendered ID-1 card as `application/pdf`. Every call invalidates
 * the previous crachá (D-14 individual path).
 */
describe('Generate Badge PDF individual (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('returns 404 for non-existent employee', async () => {
    const res = await request(app.server)
      .post('/v1/hr/employees/00000000-0000-0000-0000-000000000000/badge-pdf')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it('returns 403 for user without hr.crachas.print permission', async () => {
    const employee = await createEmployee(token);
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });
    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/badge-pdf`)
      .set('Authorization', `Bearer ${unauthorized.token}`);
    expect(res.status).toBe(403);
  });

  it('returns application/pdf with Content-Disposition and rotates the QR hash', async () => {
    const employee = await createEmployee(token);

    // Capture baseline qrTokenHash (either null or whatever createEmployee
    // seeded). After the call it MUST change to a sha256 hex.
    const before = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { qrTokenHash: true } as never,
    })) as unknown as { qrTokenHash: string | null };

    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/badge-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(true)
      .parse((r, cb) => {
        const chunks: Buffer[] = [];
        r.on('data', (c: Buffer) => chunks.push(c));
        r.on('end', () => cb(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/pdf/);
    expect(res.headers['content-disposition']).toMatch(
      /attachment; filename="cracha-/,
    );
    const pdf = res.body as Buffer;
    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.length).toBeGreaterThan(1024);
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');

    const after = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { qrTokenHash: true } as never,
    })) as unknown as { qrTokenHash: string | null };
    expect(after.qrTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(after.qrTokenHash).not.toBe(before.qrTokenHash);
  });

  it('every call rotates again — second POST overwrites the first hash', async () => {
    const employee = await createEmployee(token);

    await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/badge-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(false);
    const first = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { qrTokenHash: true } as never,
    })) as unknown as { qrTokenHash: string | null };

    await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/badge-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(false);
    const second = (await prisma.employee.findUnique({
      where: { id: employee.id },
      select: { qrTokenHash: true } as never,
    })) as unknown as { qrTokenHash: string | null };

    expect(first.qrTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(second.qrTokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(first.qrTokenHash).not.toBe(second.qrTokenHash);
  });

  it('writes a PUNCH_QR_TOKEN audit log on each generation', async () => {
    const employee = await createEmployee(token);

    const before = await prisma.auditLog.count({
      where: { entity: 'PUNCH_QR_TOKEN', entityId: employee.id },
    });

    const res = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/badge-pdf`)
      .set('Authorization', `Bearer ${token}`)
      .buffer(false);
    expect(res.status).toBe(200);

    const after = await prisma.auditLog.count({
      where: { entity: 'PUNCH_QR_TOKEN', entityId: employee.id },
    });
    // Individual badge-pdf endpoint audits ONCE per call (our handler) +
    // the RotateQrTokenUseCase does not re-audit (it publishes an event
    // only). So we expect exactly +1.
    expect(after).toBe(before + 1);
    // Sanity: hash field was set (silences an unused-var warning on
    // createHash import above in case the block is trimmed later).
    void createHash;
  });
});
