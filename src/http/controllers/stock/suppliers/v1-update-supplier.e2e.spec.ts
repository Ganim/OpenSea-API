import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Supplier (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should update supplier with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name: `Original Supplier ${timestamp}`,
        city: 'São Paulo',
        state: 'SP',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .put(`/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Supplier ${timestamp}`,
        city: 'Rio de Janeiro',
        state: 'RJ',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('supplier');
    expect(response.body.supplier).toHaveProperty('id', supplier.id);
    expect(response.body.supplier).toHaveProperty(
      'name',
      `Updated Supplier ${timestamp}`,
    );
  });

  it('should return 404 when updating non-existent supplier', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .put('/v1/suppliers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test' });

    expect(response.status).toBe(404);
  });
});
