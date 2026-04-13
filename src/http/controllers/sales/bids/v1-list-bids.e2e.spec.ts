import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Bids (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get('/v1/bids');

    expect(response.status).toBe(401);
  });

  it('should list bids with pagination (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/bids')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.bids).toBeDefined();
    expect(Array.isArray(response.body.bids)).toBe(true);
    expect(response.body.meta).toBeDefined();
    expect(response.body.meta.total).toBeGreaterThanOrEqual(0);
    expect(response.body.meta.page).toBe(1);
  });

  it('should support query filters', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/bids?page=1&limit=5&sortBy=createdAt&sortOrder=desc')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.limit).toBe(5);
  });
});
