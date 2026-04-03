import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Upload eSocial Certificate (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/esocial/certificates')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should return 400 without PFX file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/esocial/certificates')
      .set('Authorization', `Bearer ${token}`);

    // Multipart expected but not sent — should fail
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
