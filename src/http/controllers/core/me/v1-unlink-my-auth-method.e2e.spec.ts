import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Unlink My Auth Method (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should unlink auth method when not the last one', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a second auth link
    await request(app.server)
      .post('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '333.444.555-66',
        currentPassword: 'Pass@123',
      });

    // Get the CPF link ID
    const listResponse = await request(app.server)
      .get('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`);

    const cpfLink = listResponse.body.authLinks.find(
      (link: { provider: string }) => link.provider === 'CPF',
    );
    expect(cpfLink).toBeTruthy();

    const response = await request(app.server)
      .delete(`/v1/me/auth-links/${cpfLink.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/me/auth-links/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
