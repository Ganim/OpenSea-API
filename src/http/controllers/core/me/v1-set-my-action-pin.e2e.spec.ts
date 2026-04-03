import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Set My Action PIN (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should set action PIN with correct password', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/me/action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Pass@123',
        newActionPin: '1234',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
  });

  it('should return 400 with wrong password', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // First set the PIN (first-time setup skips password check)
    await request(app.server)
      .patch('/v1/me/action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'Pass@123',
        newActionPin: '1234',
      });

    // Now changing the PIN requires correct password
    const response = await request(app.server)
      .patch('/v1/me/action-pin')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: 'WrongPass@999',
        newActionPin: '5678',
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app.server).patch('/v1/me/action-pin').send({
      currentPassword: 'Pass@123',
      newActionPin: '1234',
    });

    expect(response.status).toBe(401);
  });
});
