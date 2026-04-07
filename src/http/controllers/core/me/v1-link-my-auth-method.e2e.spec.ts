import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Link My Auth Method (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should link a CPF auth method', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '123.456.789-00',
        currentPassword: 'Pass@123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('authLink');
    expect(response.body.authLink.provider).toBe('CPF');
    expect(response.body.authLink.status).toBe('ACTIVE');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).post('/v1/me/auth-links').send({
      provider: 'CPF',
      identifier: '123.456.789-00',
      currentPassword: 'Pass@123',
    });

    expect(response.status).toBe(401);
  });
});
