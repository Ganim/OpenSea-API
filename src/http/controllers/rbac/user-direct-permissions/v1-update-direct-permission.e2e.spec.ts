import { app } from '@/app';
import { makeCreateUserUseCase } from '@/use-cases/core/users/factories/make-create-user-use-case';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { makePermission } from '@/utils/tests/factories/rbac/make-permission';
import { makeUserDirectPermission } from '@/utils/tests/factories/rbac/make-user-direct-permission';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('Update Direct Permission (e2e)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update direct permission with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const permission = await makePermission();

    const createUserUseCase = makeCreateUserUseCase();
    const uniqueId = faker.string.uuid().slice(0, 8);
    const { user } = await createUserUseCase.execute({
      email: `user-${uniqueId}@${faker.internet.domainName()}`,
      password: 'Pass@123',
      username: `user${uniqueId}`,
    });

    const directPermission = await makeUserDirectPermission({
      userId: user.id.toString(),
      permissionId: permission.id.toString(),
      effect: 'allow',
    });

    const response = await request(app.server)
      .patch(
        `/v1/rbac/users/direct-permissions/${directPermission.id.toString()}`,
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        effect: 'deny',
      });

    expect(response.statusCode).toEqual(200);
    expect(response.body).toHaveProperty('success', true);
  });
});
