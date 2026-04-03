import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Process Due Reminders (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should process due reminders', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .post('/v1/calendar/reminders/process')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('processed');
    expect(response.body).toHaveProperty('errors');
    expect(typeof response.body.processed).toBe('number');
    expect(typeof response.body.errors).toBe('number');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post(
      '/v1/calendar/reminders/process',
    );

    expect(response.status).toBe(401);
  });

  it('should return 403 without super admin', async () => {
    const { token } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .post('/v1/calendar/reminders/process')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
