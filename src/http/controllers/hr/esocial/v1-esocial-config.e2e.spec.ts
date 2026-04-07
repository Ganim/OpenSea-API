import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('eSocial Config (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get eSocial config', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/esocial/config')
      .set('Authorization', `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
  });

  it('should update eSocial config', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/esocial/config')
      .set('Authorization', `Bearer ${token}`)
      .send({
        environment: 'HOMOLOGACAO',
        autoGenerate: false,
        requireApproval: true,
      });

    expect(response.statusCode).toBe(200);
  });

  it('should return 401 on GET without token', async () => {
    const response = await request(app.server).get('/v1/esocial/config');

    expect(response.statusCode).toBe(401);
  });

  it('should return 401 on PATCH without token', async () => {
    const response = await request(app.server)
      .patch('/v1/esocial/config')
      .send({ environment: 'HOMOLOGACAO' });

    expect(response.statusCode).toBe(401);
  });
});
