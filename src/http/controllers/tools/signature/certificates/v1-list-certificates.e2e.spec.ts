import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Signature Certificates (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list certificates (empty)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/signature/certificates')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('certificates');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.certificates)).toBe(true);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/signature/certificates',
    );

    expect(response.status).toBe(401);
  });
});
