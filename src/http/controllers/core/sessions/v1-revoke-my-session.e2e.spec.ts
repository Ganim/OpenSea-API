import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Revoke My Session (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should revoke my session with correct schema', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    const session = await prisma.session.create({
      data: {
        userId: user.user.id,
        ip: '192.168.1.100',
        createdAt: new Date(),
        lastUsedAt: new Date(),
      },
    });

    const response = await request(app.server)
      .patch(`/v1/sessions/me/${session.id}/revoke`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
