import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateSuperAdmin } from '@/utils/tests/factories/core/create-and-authenticate-super-admin.e2e';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update tenant name and slug', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);
    const timestamp = Date.now();

    const tenant = await prisma.tenant.create({
      data: {
        name: `Update Test ${timestamp}`,
        slug: `update-test-${timestamp}`,
        status: 'ACTIVE',
      },
    });

    const response = await request(app.server)
      .put(`/v1/admin/tenants/${tenant.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Name ${timestamp}`,
        slug: `updated-slug-${timestamp}`,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant.name).toBe(`Updated Name ${timestamp}`);
    expect(response.body.tenant.slug).toBe(`updated-slug-${timestamp}`);
  });

  it('should return 404 for non-existent tenant', async () => {
    const { token } = await createAndAuthenticateSuperAdmin(app);

    const response = await request(app.server)
      .put('/v1/admin/tenants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Does Not Exist' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 403 for non-super-admin user', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const response = await request(app.server)
      .put('/v1/admin/tenants/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Forbidden' });

    expect([400, 403]).toContain(response.status);
  });
});
