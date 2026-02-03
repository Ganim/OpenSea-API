import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Change User Profile (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change user profile with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const uniqueId = Math.random().toString(36).substring(2, 10);

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: `chgprof${uniqueId}@test.com`,
      username: `chgprof${uniqueId}`,
      password: 'Pass@123',
    });

    const response = await request(app.server)
      .patch(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        profile: {
          name: 'NovoNome',
          surname: 'NovoSobrenome',
          bio: 'Bio editada',
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('profile');
  });
});
