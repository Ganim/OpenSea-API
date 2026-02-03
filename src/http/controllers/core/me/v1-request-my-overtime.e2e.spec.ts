import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Request My Overtime (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should request overtime for myself', { timeout: 15000 }, async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
      fullName: 'Overtime Request Employee',
    });

    const response = await request(app.server)
      .post('/v1/me/overtime')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date().toISOString(),
        hours: 2,
        reason: 'Project deadline - need extra hours to complete deliverable',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('overtime');
    expect(response.body.overtime).toHaveProperty('id');
  });

  it('should return 404 when user has no employee record', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/me/overtime')
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date().toISOString(),
        hours: 2,
        reason: 'Project deadline - need extra hours to complete deliverable',
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).post('/v1/me/overtime').send({
      date: new Date().toISOString(),
      hours: 2,
      reason: 'Project deadline - need extra hours to complete deliverable',
    });

    expect(response.status).toBe(401);
  });
});
