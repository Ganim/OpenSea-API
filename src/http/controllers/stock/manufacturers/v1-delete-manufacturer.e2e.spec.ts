import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete Manufacturer (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a manufacturer', async () => {
    const timestamp = Date.now();

    // Create a manufacturer
    const manufacturer = await prisma.manufacturer.create({
      data: {
        name: `Manufacturer to Delete ${timestamp}`,
        country: 'United States',
        isActive: true,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/manufacturers/${manufacturer.id}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(204);

    // Verify manufacturer was soft deleted
    const deletedManufacturer = await prisma.manufacturer.findUnique({
      where: { id: manufacturer.id },
    });

    expect(deletedManufacturer?.deletedAt).not.toBeNull();
  });

  it('should return 404 when trying to delete a non-existent manufacturer', async () => {
    const response = await request(app.server)
      .delete('/v1/manufacturers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Manufacturer not found');
  });
});
