import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Work Center By Id (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get a work center by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a work center first
    const createResponse = await request(app.server)
      .post('/v1/production/work-centers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `WC-GET-${ts}`,
        name: `Work Center Get ${ts}`,
        description: 'Get test description',
      });

    const wcId = createResponse.body.workCenter.id;

    const response = await request(app.server)
      .get(`/v1/production/work-centers/${wcId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.workCenter).toEqual(
      expect.objectContaining({
        id: wcId,
        code: `WC-GET-${ts}`,
        name: `Work Center Get ${ts}`,
        description: 'Get test description',
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/work-centers/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
