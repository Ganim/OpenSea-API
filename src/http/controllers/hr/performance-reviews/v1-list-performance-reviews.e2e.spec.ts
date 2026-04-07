import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Performance Reviews (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list performance reviews when authenticated', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const response = await request(app.server)
      .get('/v1/hr/performance-reviews')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('reviews');
    expect(response.body).toHaveProperty('total');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/hr/performance-reviews',
    );
    expect(response.status).toBe(401);
  });
});
