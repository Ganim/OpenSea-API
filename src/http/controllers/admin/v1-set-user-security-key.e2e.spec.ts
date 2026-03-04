import { app } from '@/app';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Set User Security Key (E2E)', () => {
  let tenantId: string;
  let userId: string;
  let userToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    userId = auth.user.user.id;
    userToken = auth.token;

    const sa = await createAndAuthenticateSuperAdmin(app);
    superAdminToken = sa.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set a security key for a user', async () => {
    const response = await request(app.server)
      .patch(`/v1/admin/tenants/${tenantId}/users/${userId}/security-key`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ securityKey: 'my-secret-key' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('definida');
  });

  it('should verify the security key returns valid: true', async () => {
    // Set key first
    await request(app.server)
      .patch(`/v1/admin/tenants/${tenantId}/users/${userId}/security-key`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ securityKey: 'verify-this-key' });

    // Verify with correct key
    const response = await request(app.server)
      .post('/v1/storage/security/verify-key')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ key: 'verify-this-key' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
  });

  it('should verify wrong key returns valid: false', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/verify-key')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ key: 'wrong-key' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
  });

  it('should remove a security key', async () => {
    const response = await request(app.server)
      .patch(`/v1/admin/tenants/${tenantId}/users/${userId}/security-key`)
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ securityKey: null });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('removida');

    // Verify returns false after removal
    const verifyResponse = await request(app.server)
      .post('/v1/storage/security/verify-key')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ key: 'verify-this-key' });

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.valid).toBe(false);
  });

  it('should return 404 for non-existent user', async () => {
    const response = await request(app.server)
      .patch(
        `/v1/admin/tenants/${tenantId}/users/00000000-0000-0000-0000-000000000000/security-key`,
      )
      .set('Authorization', `Bearer ${superAdminToken}`)
      .send({ securityKey: 'test' });

    expect(response.status).toBe(404);
  });

  it('should return 403 for non-super-admin', async () => {
    const response = await request(app.server)
      .patch(`/v1/admin/tenants/${tenantId}/users/${userId}/security-key`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ securityKey: 'test' });

    expect([400, 403]).toContain(response.status);
  });
});
