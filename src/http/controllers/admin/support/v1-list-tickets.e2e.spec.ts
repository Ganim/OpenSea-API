import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin List Tickets (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should list all support tickets', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/support/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tickets');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.tickets)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
  });

  it('should accept filters', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/support/tickets?status=OPEN&priority=HIGH')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tickets');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/support/tickets')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
