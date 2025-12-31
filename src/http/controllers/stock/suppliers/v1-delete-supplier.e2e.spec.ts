import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Supplier (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a supplier', async () => {
    const timestamp = Date.now();

    // Create a supplier
    const supplier = await prisma.supplier.create({
      data: {
        name: `Supplier to Delete ${timestamp}`,
        city: 'São Paulo',
        state: 'SP',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/suppliers/${supplier.id}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(204);

    // Verify supplier was soft deleted
    const deletedSupplier = await prisma.supplier.findUnique({
      where: { id: supplier.id },
    });

    expect(deletedSupplier?.deletedAt).not.toBeNull();
  });

  it('should return 404 when trying to delete a non-existent supplier', async () => {
    const response = await request(app.server)
      .delete('/v1/suppliers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Supplier not found');
  });
});
