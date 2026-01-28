import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('List User Sessions By Date (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list user sessions by date with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const uniqueId = Math.random().toString(36).substring(2, 10);

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: `sessdt${uniqueId}@test.com`,
      username: `sessdt${uniqueId}`,
      password: 'Pass@123',
    });

    await prisma.session.create({
      data: {
        userId: user.id,
        ip: '192.168.1.1',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const to = new Date().toISOString();

    const response = await request(app.server)
      .get(
        `/v1/sessions/user/${user.id}/by-date?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });
});
