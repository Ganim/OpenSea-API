import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Workstation By Id (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get a workstation by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first
    const typeResponse = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Type for WS Get ${ts}`,
      });

    const workstationTypeId = typeResponse.body.workstationType.id;

    // Create a workstation
    const createResponse = await request(app.server)
      .post('/v1/production/workstations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workstationTypeId,
        code: `WS-GET-${ts}`,
        name: `Workstation Get ${ts}`,
        description: 'Get test description',
      });

    const wsId = createResponse.body.workstation.id;

    const response = await request(app.server)
      .get(`/v1/production/workstations/${wsId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.workstation).toEqual(
      expect.objectContaining({
        id: wsId,
        code: `WS-GET-${ts}`,
        name: `Workstation Get ${ts}`,
        description: 'Get test description',
        workstationTypeId,
      }),
    );
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/workstations/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
