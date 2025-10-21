import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Delete Location (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app, 'MANAGER');
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to delete a location (soft delete)', async () => {
    const timestamp = Date.now();
    const location = await prisma.location.create({
      data: {
        code: `WH-DELETE-${timestamp}`,
        description: 'Location to be deleted',
      },
    });

    const response = await request(app.server)
      .delete(`/v1/locations/${location.id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send();

    expect(response.status).toBe(204);

    // Verify the location is soft deleted
    const deletedLocation = await prisma.location.findUnique({
      where: { id: location.id },
    });

    expect(deletedLocation).not.toBeNull();
    expect(deletedLocation?.deletedAt).not.toBeNull();
  });

  it('should not be able to delete a non-existent location', async () => {
    const nonExistentId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .delete(`/v1/locations/${nonExistentId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send();

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Location not found');
  });
});
