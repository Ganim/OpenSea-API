import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Admin Link Auth Method (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should link auth method to a user as admin', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { user: targetUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    const response = await request(app.server)
      .post(`/v1/users/${targetUser.user.id}/auth-links`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '444.555.666-77',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('authLink');
    expect(response.body.authLink.provider).toBe('CPF');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/users/00000000-0000-0000-0000-000000000000/auth-links')
      .send({
        provider: 'CPF',
        identifier: '444.555.666-77',
      });

    expect(response.status).toBe(401);
  });
});
