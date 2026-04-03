import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Verify Security Key (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;
  });


  it('should return valid: false when user has no security key', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/verify-key')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: 'any-key' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
  });

  it('should return valid: true for correct security key', async () => {
    const { hash } = await import('bcryptjs');
    const securityKeyHash = await hash('my-secret-key', 6);

    const { prisma } = await import('@/lib/prisma');
    await prisma.tenantUser.updateMany({
      where: { userId, tenantId },
      data: { securityKeyHash },
    });

    const response = await request(app.server)
      .post('/v1/storage/security/verify-key')
      .set('Authorization', `Bearer ${token}`)
      .send({ key: 'my-secret-key' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);

    // Clean up
    await prisma.tenantUser.updateMany({
      where: { userId, tenantId },
      data: { securityKeyHash: null },
    });
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/verify-key')
      .send({ key: 'any-key' });

    expect(response.status).toBe(401);
  });
});
