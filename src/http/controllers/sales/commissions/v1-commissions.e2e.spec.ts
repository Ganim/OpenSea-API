import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Commissions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  describe('GET /v1/sales/commissions', () => {
    it('should return 401 without token', async () => {
      const response = await request(app.server)
        .get('/v1/sales/commissions');

      expect(response.status).toBe(401);
    });

    it('should list commissions', async () => {
      const { token } = await createAndAuthenticateUser(app, { tenantId });

      const response = await request(app.server)
        .get('/v1/sales/commissions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.commissions).toBeDefined();
      expect(Array.isArray(response.body.commissions)).toBe(true);
      expect(response.body.meta).toBeDefined();
    });
  });
});
