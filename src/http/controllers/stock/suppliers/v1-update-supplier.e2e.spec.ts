import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Update Supplier (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update supplier with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    const supplier = await prisma.supplier.create({
      data: {
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
    expect(response.body.supplier).toHaveProperty('name', `Updated Supplier ${timestamp}`);
  });
});
