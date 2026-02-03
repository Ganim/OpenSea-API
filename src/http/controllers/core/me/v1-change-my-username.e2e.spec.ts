import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Change My Username (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change my username with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const newUsername = `meuser_${Date.now()}`;

    const response = await request(app.server)
      .patch('/v1/me/username')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: newUsername });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('username');
  });
});
