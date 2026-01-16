import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Revoke Session (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should revoke session with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app);

    const session = await prisma.session.create({
      data: {
        userId: user.user.id,
        ip: '192.168.1.1',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .patch(`/v1/sessions/${session.id}/revoke`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
