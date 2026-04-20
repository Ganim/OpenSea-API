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

async function createEmployeeAndEnroll(token: string, count: number) {
  const empRes = await request(app.server)
    .post('/v1/hr/employees')
    .set('Authorization', `Bearer ${token}`)
    .send(generateEmployeeData());
  const employeeId = empRes.body.employee.id;

  await request(app.server)
    .post(`/v1/hr/employees/${employeeId}/face-enrollments`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      embeddings: Array.from({ length: count }, () => makeEmbedding()),
      consentTextHash: VALID_HASH,
    });

  return employeeId;
}

describe('Remove Face Enrollments (E2E)', () => {
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
      .delete(
        '/v1/hr/employees/00000000-0000-0000-0000-000000000000/face-enrollments',
      )
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(404);
  });

  it('returns 403 for user without hr.face-enrollment.remove permission', async () => {
    const employeeId = await createEmployeeAndEnroll(token, 3);
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}/face-enrollments`)
      .set('Authorization', `Bearer ${unauthorized.token}`);

    expect(response.status).toBe(403);
  });

  it('soft-deletes all enrollments and returns removedCount (200)', async () => {
    const employeeId = await createEmployeeAndEnroll(token, 4);

    const response = await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ removedCount: 4 });

    const active = await prisma.employeeFaceEnrollment.findMany({
      where: { tenantId, employeeId, deletedAt: null },
    });
    expect(active).toHaveLength(0);

    const deleted = await prisma.employeeFaceEnrollment.findMany({
      where: { tenantId, employeeId, NOT: { deletedAt: null } },
    });
    expect(deleted).toHaveLength(4);
  });

  it('is idempotent — second call returns removedCount: 0', async () => {
    const employeeId = await createEmployeeAndEnroll(token, 3);

    await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`);

    const second = await request(app.server)
      .delete(`/v1/hr/employees/${employeeId}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`);

    expect(second.status).toBe(200);
    expect(second.body).toEqual({ removedCount: 0 });
  });
});
