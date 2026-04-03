import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Get Support Metrics (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });


  it('should return support metrics', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/support/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalTickets');
    expect(response.body).toHaveProperty('openTickets');
    expect(response.body).toHaveProperty('resolvedTickets');
    expect(response.body).toHaveProperty('closedTickets');
    expect(typeof response.body.totalTickets).toBe('number');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/support/metrics')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
