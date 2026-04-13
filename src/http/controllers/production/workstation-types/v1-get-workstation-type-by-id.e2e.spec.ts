import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Workstation Type By Id (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get a workstation type by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first
    const createResponse = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `WS Type Get ${ts}`,
        description: 'Get test description',
        color: '#123456',
      });

    const typeId = createResponse.body.workstationType.id;

    const response = await request(app.server)
      .get(`/v1/production/workstation-types/${typeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.workstationType).toEqual(
      expect.objectContaining({
        id: typeId,
        name: `WS Type Get ${ts}`,
        description: 'Get test description',
        color: '#123456',
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/workstation-types/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
