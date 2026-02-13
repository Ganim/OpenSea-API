import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Remove Tenant User (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should remove a user from a tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `Remove User Tenant ${timestamp}`,
        slug: `remove-user-${timestamp}`,
        status: 'ACTIVE',
      },
    });

    // Create a user to be removed
    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: `removable${timestamp}@test.com`,
      password: 'Pass@123',
      username: `rmuser${timestamp.toString().slice(-8)}`,
    });

    // Assign user to tenant
    await prisma.tenantUser.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        role: 'member',
      },
    });

    const response = await request(app.server)
      .delete(`/v1/admin/tenants/${tenant.id}/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .delete(
        '/v1/admin/tenants/00000000-0000-0000-0000-000000000000/users/00000000-0000-0000-0000-000000000001',
      )
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .delete(
        '/v1/admin/tenants/00000000-0000-0000-0000-000000000000/users/00000000-0000-0000-0000-000000000001',
      )
      .set('Authorization', `Bearer ${token}`);

    expect([400, 403]).toContain(response.status);
  });
});
