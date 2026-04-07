import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin List Skill Pricing (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should list all skill pricing', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/catalog/pricing')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pricing');
    expect(Array.isArray(response.body.pricing)).toBe(true);
  });

  it('should accept pricingType filter', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .get('/v1/admin/catalog/pricing?pricingType=FLAT')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('pricing');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .get('/v1/admin/catalog/pricing')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(403);
  });
});
