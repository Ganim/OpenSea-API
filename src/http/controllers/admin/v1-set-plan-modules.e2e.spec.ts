import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Set Plan Modules (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set modules for a plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    // Create a plan
    const createResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Modules Test ${Date.now()}` });

    const planId = createResponse.body.plan.id;

    // Set modules
    const response = await request(app.server)
      .put(`/v1/admin/plans/${planId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ modules: ['CORE', 'STOCK', 'SALES'] });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('modules');
    expect(response.body.modules).toHaveLength(3);
    expect(
      response.body.modules.map((m: { module: string }) => m.module),
    ).toEqual(expect.arrayContaining(['CORE', 'STOCK', 'SALES']));
  });

  it('should replace existing modules', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    // Create a plan
    const createResponse = await request(app.server)
      .post('/v1/admin/plans')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Replace Modules ${Date.now()}` });

    const planId = createResponse.body.plan.id;

    // Set initial modules
    await request(app.server)
      .put(`/v1/admin/plans/${planId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ modules: ['CORE'] });

    // Replace with new modules
    const response = await request(app.server)
      .put(`/v1/admin/plans/${planId}/modules`)
      .set('Authorization', `Bearer ${token}`)
      .send({ modules: ['CORE', 'STOCK', 'SALES', 'HR'] });

    expect(response.status).toBe(200);
    expect(response.body.modules).toHaveLength(4);
  });

  it('should return 404 for non-existent plan', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .put('/v1/admin/plans/00000000-0000-0000-0000-000000000000/modules')
      .set('Authorization', `Bearer ${token}`)
      .send({ modules: ['CORE'] });

    expect(response.status).toBe(404);
  });
});
