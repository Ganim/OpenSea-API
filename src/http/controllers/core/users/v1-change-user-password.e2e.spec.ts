import { hash } from 'bcryptjs';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Change User Password (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should change user password with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const user = await prisma.user.create({
      data: {
        email: `change-pwd-${timestamp}@test.com`,
        username: `chgpwd${timestamp}`,
        password_hash: await hash('Pass@123', 6),
      },
    });

    const response = await request(app.server)
      .patch(`/v1/users/${user.id}/password`)
      .set('Authorization', `Bearer ${token}`)
      .send({ password: 'NewPass@123' });

    expect(response.status).toBe(200);
  });
});
