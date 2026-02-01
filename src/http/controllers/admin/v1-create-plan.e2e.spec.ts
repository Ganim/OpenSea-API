import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Create Plan (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test Plan E2E',
        tier: 'STARTER',
        price: 49.9,
        maxUsers: 10,
        maxWarehouses: 3,
        maxProducts: 500,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('plan');
    expect(response.body.plan.name).toBe('Test Plan E2E');
    expect(response.body.plan.tier).toBe('STARTER');
    expect(response.body.plan.price).toBe(49.9);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Forbidden Plan',
        tier: 'FREE',
      });

    expect(response.status).toBe(403);
  });

  it('should return 400 for duplicate plan name', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const uniqueName = `Dup Plan ${Date.now()}`;

    await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: uniqueName });

    const response = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: uniqueName });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });
});
