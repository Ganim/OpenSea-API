import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

const VALID_HASH = 'a'.repeat(64);

function makeEmbedding(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 128; i++) arr.push(Math.random() * 2 - 1);
  return arr;
}

async function createEmployee(token: string) {
  const res = await request(app.server)
    .post('/v1/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send(generateEmployeeData());
  return res.body.employee as { id: string; fullName: string };
}

describe('Create Face Enrollments (E2E)', () => {
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
    const response = await request(app.server)
      .post(
        '/v1/hr/employees/00000000-0000-0000-0000-000000000000/face-enrollments',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
      });

    expect(response.status).toBe(404);
  });

  it('rejects < 3 embeddings with 400', async () => {
    const employee = await createEmployee(token);
    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
      });

    expect(response.status).toBe(400);
  });

  it('rejects > 5 embeddings with 400', async () => {
    const employee = await createEmployee(token);
    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
        ],
        consentTextHash: VALID_HASH,
      });

    expect(response.status).toBe(400);
  });

  it('rejects non-128-dim embeddings with 400', async () => {
    const employee = await createEmployee(token);
    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), [0.1, 0.2]],
        consentTextHash: VALID_HASH,
      });

    expect(response.status).toBe(400);
  });

  it('rejects invalid consent hash (not sha256 hex) with 400', async () => {
    const employee = await createEmployee(token);
    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: 'not-a-hash',
      });

    expect(response.status).toBe(400);
  });

  it('returns 403 for user without hr.face-enrollment.register permission', async () => {
    const employee = await createEmployee(token);
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${unauthorized.token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
      });

    expect(response.status).toBe(403);
  });

  it('persists encrypted enrollments and returns DTOs scrubbed of ciphertext (201)', async () => {
    const employee = await createEmployee(token);
    const response = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
      });

    expect(response.status).toBe(201);
    expect(response.body.enrollments).toHaveLength(3);
    expect(response.body).toHaveProperty('replacedCount', 0);

    // T-FACE-03 sentinel — DTO NEVER exposes crypto material
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('embedding');
    expect(serialized).not.toContain('ciphertext');
    expect(serialized).not.toContain('iv');
    expect(serialized).not.toContain('authTag');

    // Database row count matches the payload
    const rows = await prisma.employeeFaceEnrollment.findMany({
      where: { tenantId, employeeId: employee.id, deletedAt: null },
    });
    expect(rows).toHaveLength(3);
    // Each row has a distinct IV
    const ivs = rows.map((r) => Buffer.from(r.iv).toString('hex'));
    expect(new Set(ivs).size).toBe(3);
    // Every row FKs back to a CONSENT audit log row
    for (const row of rows) {
      expect(row.consentAuditLogId).not.toBeNull();
    }

    // Consent audit log was written BEFORE enrollment (D-07). We find it by
    // entityId + the PUNCH_FACE_ENROLLMENT description fragment.
    const consentLogs = await prisma.auditLog.findMany({
      where: {
        tenantId,
        entityId: employee.id,
        entity: 'FACE_ENROLLMENT',
      },
    });
    expect(consentLogs.length).toBeGreaterThanOrEqual(2);
    // At least one is the consent row (CREATE action, description mentions "consentimento")
    expect(
      consentLogs.some((l) =>
        (l.description ?? '').toLowerCase().includes('consentimento'),
      ),
    ).toBe(true);
  });

  it('replace policy: second create soft-deletes old rows and surfaces replacedCount (D-05)', async () => {
    const employee = await createEmployee(token);
    // First batch of 4
    await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
          makeEmbedding(),
        ],
        consentTextHash: VALID_HASH,
      });

    // Second batch of 3 replaces the first
    const second = await request(app.server)
      .post(`/v1/hr/employees/${employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
      });

    expect(second.status).toBe(201);
    expect(second.body.replacedCount).toBe(4);

    // 4 rows soft-deleted + 3 active = 7 total rows in DB for this employee
    const all = await prisma.employeeFaceEnrollment.findMany({
      where: { tenantId, employeeId: employee.id },
    });
    expect(all).toHaveLength(7);
    const active = all.filter((r) => r.deletedAt === null);
    const deleted = all.filter((r) => r.deletedAt !== null);
    expect(active).toHaveLength(3);
    expect(deleted).toHaveLength(4);
  });
});
