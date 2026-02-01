import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Plan (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should deactivate a plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    // Create a plan
    const createResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Delete Test ${Date.now()}`, isActive: true });

    const planId = createResponse.body.plan.id;

    // Delete (deactivate)
    const response = await request(app.server)
      .delete(`/v1/admin/plans/${planId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('plan');
    expect(response.body.plan.isActive).toBe(false);
  });

  it('should return 404 for non-existent plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .delete('/v1/admin/plans/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
