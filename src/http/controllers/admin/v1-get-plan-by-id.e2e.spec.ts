import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Get Plan By ID (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a plan by id with modules', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    // Create a plan
    const createResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `GetById Test ${Date.now()}`, tier: 'STARTER' });

    const planId = createResponse.body.plan.id;

    // Set modules
    await request(app.server)
      .put(`/v1/admin/plans/${planId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ modules: ['CORE', 'STOCK'] });

    // Get by id
    const response = await request(app.server)
      .get(`/v1/admin/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('plan');
    expect(response.body).toHaveProperty('modules');
    expect(response.body.plan.id).toBe(planId);
    expect(response.body.modules).toHaveLength(2);
  });

  it('should return 404 for non-existent plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/plans/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
