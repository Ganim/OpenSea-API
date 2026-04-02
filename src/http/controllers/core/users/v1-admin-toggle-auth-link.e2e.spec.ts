import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Admin Toggle Auth Link (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should toggle auth link status for a user', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { user: targetUser, token: targetToken } =
      await createAndAuthenticateUser(app, { tenantId });

    // Create a second auth link for target user
    await request(app.server)
      .post(`/v1/users/${targetUser.user.id}/auth-links`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '555.666.777-88',
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
      .patch(
        `/v1/users/${targetUser.user.id}/auth-links/${cpfLink.id}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('authLink');
    expect(response.body.authLink.status).toBe('INACTIVE');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch(
        '/v1/users/00000000-0000-0000-0000-000000000000/auth-links/00000000-0000-0000-0000-000000000001',
      )
      .send({ status: 'INACTIVE' });

    expect(response.status).toBe(401);
  });
});
