import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { generateEmployeeData } from '@/utils/tests/factories/hr/create-employee.e2e';

const VALID_HASH = 'a'.repeat(64);

function makeEmbedding(): number[] {
  const arr: number[] = [];
  for (let i = 0; i < 128; i++) arr.push(Math.random() * 2 - 1);
  return arr;
}

describe('List Face Enrollments (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('returns 401 without token', async () => {
    const empRes = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData());
    const response = await request(app.server).get(
      `/v1/hr/employees/${empRes.body.employee.id}/face-enrollments`,
    );
    expect(response.status).toBe(401);
  });

  it('returns 403 for user without hr.face-enrollment.access permission', async () => {
    const empRes = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData());
    const unauthorized = await createAndAuthenticateUser(app, {
      tenantId,
      permissions: [],
    });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${empRes.body.employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${unauthorized.token}`);

    expect(response.status).toBe(403);
  });

  it('returns empty list for employee with no enrollments (200)', async () => {
    const empRes = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData());

    const response = await request(app.server)
      .get(`/v1/hr/employees/${empRes.body.employee.id}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ items: [], count: 0 });
  });

  it('returns metadata-only DTOs after enrollment (no ciphertext)', async () => {
    const empRes = await request(app.server)
      .post('/v1/hr/employees')
      .set('Authorization', `Bearer ${token}`)
      .send(generateEmployeeData());
    const employeeId = empRes.body.employee.id;

    await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        embeddings: [makeEmbedding(), makeEmbedding(), makeEmbedding()],
        consentTextHash: VALID_HASH,
      });

    const response = await request(app.server)
      .get(`/v1/hr/employees/${employeeId}/face-enrollments`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.count).toBe(3);
    expect(response.body.items).toHaveLength(3);

    // T-FACE-03 sentinel
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain('embedding');
    expect(serialized).not.toContain('ciphertext');
    expect(serialized).not.toContain('iv');
    expect(serialized).not.toContain('authTag');

    for (const item of response.body.items) {
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('employeeId', employeeId);
      expect(item).toHaveProperty('photoCount');
      expect(item).toHaveProperty('capturedAt');
      expect(item).toHaveProperty('capturedByUserId');
      expect(item).toHaveProperty('createdAt');
    }
  });
});
