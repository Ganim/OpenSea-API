import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('List My Overtime (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list my overtime requests', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
      fullName: 'Overtime List Employee',
    });

    const response = await request(app.server)
      .get('/v1/me/overtime')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('overtimes');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.overtimes)).toBe(true);
    expect(typeof response.body.total).toBe('number');
  });

  it('should return 404 when user has no employee record', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/me/overtime')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server).get('/v1/me/overtime');

    expect(response.status).toBe(401);
  });
});
