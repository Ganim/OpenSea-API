import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Admin Unlink Auth Method (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should unlink auth method from a user as admin', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { user: targetUser } = await createAndAuthenticateUser(app, {
      tenantId,
    });

    // Create a second auth link for target user
    await request(app.server)
      .post(`/v1/users/${targetUser.user.id}/auth-links`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '666.777.888-99',
      });

    // Get the link ID
    const listResponse = await request(app.server)
      .get(`/v1/users/${targetUser.user.id}/auth-links`)
      .set('Authorization', `Bearer ${token}`);

    const cpfLink = listResponse.body.authLinks.find(
      (link: { provider: string }) => link.provider === 'CPF',
    );
    expect(cpfLink).toBeTruthy();

    const response = await request(app.server)
      .delete(`/v1/users/${targetUser.user.id}/auth-links/${cpfLink.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).delete(
      '/v1/users/00000000-0000-0000-0000-000000000000/auth-links/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });
});
