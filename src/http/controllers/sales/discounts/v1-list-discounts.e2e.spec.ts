import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Discounts (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/sales/discount-rules');

    expect(response.status).toBe(401);
  });

  it('should list discount rules (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/discount-rules')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('discountRules');
    expect(Array.isArray(response.body.discountRules)).toBe(true);
    expect(response.body).toHaveProperty('total');
  });

  it('should support pagination', async () => {
    const response = await request(app.server)
      .get('/v1/sales/discount-rules?page=1&perPage=5')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('discountRules');
  });
});
