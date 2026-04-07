import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Brand (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  describe('GET /v1/brand', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server).get('/v1/brand');

      expect(response.status).toBe(401);
    });

    it('should get brand identity', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/brand')
        .set('Authorization', `Bearer ${token}`);

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.brand).toBeDefined();
      }
    });
  });

  describe('PUT /v1/brand', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .put('/v1/brand')
        .send({ name: 'Test Brand' });

      expect(response.status).toBe(401);
    });
  });
});
