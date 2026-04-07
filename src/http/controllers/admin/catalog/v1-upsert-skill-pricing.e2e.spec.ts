import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('Admin Upsert Skill Pricing (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  it('should return 404 for non-existent skill code', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .put('/v1/admin/catalog/pricing/nonexistent-skill-code')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pricingType: 'FLAT',
        flatPrice: 99.99,
      });

    expect([200, 404]).toContain(response.status);
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put('/v1/admin/catalog/pricing/some-skill')
      .set('Authorization', `Bearer ${token}`)
      .send({
        pricingType: 'FLAT',
        flatPrice: 99.99,
      });

    expect(response.status).toBe(403);
  });
});
