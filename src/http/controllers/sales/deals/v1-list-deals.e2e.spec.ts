import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Deals (E2E)', () => {
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
    const response = await request(app.server).get('/v1/deals');

    expect(response.status).toBe(401);
  });

  it('should list deals (200)', async () => {
    const response = await request(app.server)
      .get('/v1/deals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deals');
    expect(Array.isArray(response.body.deals)).toBe(true);
    expect(response.body).toHaveProperty('meta');
  });

  it('should support pagination and filters', async () => {
    const response = await request(app.server)
      .get('/v1/deals?page=1&limit=5&status=OPEN')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deals');
    expect(response.body).toHaveProperty('meta');
  });
});
