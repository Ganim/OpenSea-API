import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Auth Links Management (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should list my auth links', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('authLinks');
    expect(Array.isArray(response.body.authLinks)).toBe(true);
    expect(response.body.authLinks.length).toBeGreaterThanOrEqual(1);

    // Should have at least the EMAIL auth link created on registration
    const emailLink = response.body.authLinks.find(
      (link: { provider: string }) => link.provider === 'EMAIL',
    );
    expect(emailLink).toBeTruthy();
    expect(emailLink.status).toBe('ACTIVE');
  });

  it('should link CPF method', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '987.654.321-00',
        currentPassword: 'Pass@123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('authLink');
    expect(response.body.authLink.provider).toBe('CPF');
    expect(response.body.authLink.status).toBe('ACTIVE');
  });

  it('should toggle auth link status', async () => {
    const { token, user } = await createAndAuthenticateUser(app, {
      tenantId,
    });
    const _userId = user.user.id;

    // First, create a second auth link so we have 2 active methods
    await request(app.server)
      .post('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '111.222.333-44',
        currentPassword: 'Pass@123',
      });

    // Get the list to find the CPF auth link ID
    const listResponse = await request(app.server)
      .get('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`);

    const cpfLink = listResponse.body.authLinks.find(
      (link: { provider: string }) => link.provider === 'CPF',
    );
    expect(cpfLink).toBeTruthy();

    // Toggle CPF link to INACTIVE
    const response = await request(app.server)
      .patch(`/v1/me/auth-links/${cpfLink.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'INACTIVE' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('authLink');
    expect(response.body.authLink.status).toBe('INACTIVE');
  });

  it('should unlink auth method when not the last one', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create a second auth link (CPF) so deletion is allowed
    await request(app.server)
      .post('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        provider: 'CPF',
        identifier: '555.666.777-88',
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

    // Delete the CPF link (should succeed since EMAIL still exists)
    const response = await request(app.server)
      .delete(`/v1/me/auth-links/${cpfLink.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });

  it('should reject unlinking last active method', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Get the only auth link (EMAIL)
    const listResponse = await request(app.server)
      .get('/v1/me/auth-links')
      .set('Authorization', `Bearer ${token}`);

    expect(listResponse.body.authLinks.length).toBe(1);
    const emailLink = listResponse.body.authLinks[0];

    // Try to delete the only auth link (should fail)
    const response = await request(app.server)
      .delete(`/v1/me/auth-links/${emailLink.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect([400, 403, 422]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  });
});
