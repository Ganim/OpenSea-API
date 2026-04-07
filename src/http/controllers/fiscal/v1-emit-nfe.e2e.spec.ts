import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Emit NF-e (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post('/v1/fiscal/nfe').send({});

    expect(response.status).toBe(401);
  });

  it('should reject invalid body', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/fiscal/nfe')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});
