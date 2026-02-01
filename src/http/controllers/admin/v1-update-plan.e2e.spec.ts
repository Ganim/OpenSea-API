import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Plan (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update a plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    // Create a plan
    const createResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Update Test ${Date.now()}`, tier: 'FREE', price: 0 });

    const planId = createResponse.body.plan.id;

    // Update
    const response = await request(app.server)
      .put(`/v1/admin/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Plan Name',
        tier: 'STARTER',
        price: 99.9,
        maxUsers: 20,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('plan');
    expect(response.body.plan.name).toBe('Updated Plan Name');
    expect(response.body.plan.tier).toBe('STARTER');
    expect(response.body.plan.price).toBe(99.9);
    expect(response.body.plan.maxUsers).toBe(20);
  });

  it('should return 404 for non-existent plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .put('/v1/admin/plans/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Does Not Exist' });

    expect(response.status).toBe(404);
  });
});
