import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Work Center (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a work center', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/production/work-centers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `WC-${ts}`,
        name: `Work Center Test ${ts}`,
        description: 'Test work center description',
        isActive: true,
      });

    expect(response.status).toBe(201);
    expect(response.body.workCenter).toEqual(
      expect.objectContaining({
        code: `WC-${ts}`,
        name: `Work Center Test ${ts}`,
        description: 'Test work center description',
        isActive: true,
      }),
    );
    expect(response.body.workCenter.id).toBeDefined();
    expect(response.body.workCenter.createdAt).toBeDefined();
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/production/work-centers')
      .send({
        code: 'WC-UNAUTH',
        name: 'Unauthorized Work Center',
      });

    expect(response.status).toBe(401);
  });
});
