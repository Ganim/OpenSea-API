import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Email To Entry Config (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get email-to-entry config', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/finance/email-to-entry/config')
      .set('Authorization', `Bearer ${token}`);

    expect([200, 404]).toContain(response.status);
  });

  it('should return 401 without auth on GET', async () => {
    const response = await request(app.server).get(
      '/v1/finance/email-to-entry/config',
    );

    expect(response.status).toBe(401);
  });

  it('should return 401 without auth on POST', async () => {
    const response = await request(app.server)
      .post('/v1/finance/email-to-entry/config')
      .send({ enabled: true });

    expect(response.status).toBe(401);
  });
});
