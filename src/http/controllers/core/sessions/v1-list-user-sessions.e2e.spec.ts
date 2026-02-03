import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List User Sessions (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list user sessions with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const uniqueId = Math.random().toString(36).substring(2, 10);

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: `sess${uniqueId}@test.com`,
      username: `sess${uniqueId}`,
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

    const response = await request(app.server)
      .get(`/v1/sessions/user/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('sessions');
    expect(Array.isArray(response.body.sessions)).toBe(true);
  });
});
