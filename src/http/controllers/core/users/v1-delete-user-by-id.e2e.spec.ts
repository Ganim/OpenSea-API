import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete User By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete user by id with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const uniqueId = Math.random().toString(36).substring(2, 10);

    const createUserUseCase = makeCreateUserUseCase();
    const { user } = await createUserUseCase.execute({
      email: `delusr${uniqueId}@test.com`,
      username: `delusr${uniqueId}`,
      password: 'Pass@123',
    });

    const response = await request(app.server)
      .delete(`/v1/users/${user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
  });
});
