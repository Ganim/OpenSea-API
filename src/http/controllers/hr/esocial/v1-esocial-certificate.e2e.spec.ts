import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('eSocial Certificate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get certificate info (or 404 if none)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/esocial/certificate')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.statusCode);
  });

  it('should return 401 on GET without token', async () => {
    const response = await request(app.server).get('/v1/esocial/certificate');

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 on POST without token', async () => {
    const response = await request(app.server).post('/v1/esocial/certificate');

    expect(response.statusCode).toBe(401);
  });
});
