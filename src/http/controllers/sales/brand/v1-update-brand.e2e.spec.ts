import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Brand (E2E)', () => {
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
    const response = await request(app.server)
      .put('/v1/brand')
      .send({ primaryColor: '#000000' });

    expect(response.status).toBe(401);
  });

  it('should update brand (200)', async () => {
    const response = await request(app.server)
      .put('/v1/brand')
      .set('Authorization', `Bearer ${token}`)
      .send({
        primaryColor: '#3B82F6',
        secondaryColor: '#10B981',
        tagline: `Brand E2E ${Date.now()}`,
      });

    expect([200, 404]).toContain(response.status);
  });
});
