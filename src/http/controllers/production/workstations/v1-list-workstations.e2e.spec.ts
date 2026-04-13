import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Workstations (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list workstations', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first
    const typeResponse = await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Type for WS List ${ts}`,
      });

    const workstationTypeId = typeResponse.body.workstationType.id;

    // Create a workstation
    await request(app.server)
      .post('/v1/production/workstations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        workstationTypeId,
        code: `WS-LIST-${ts}`,
        name: `Workstation List ${ts}`,
      });

    const response = await request(app.server)
      .get('/v1/production/workstations')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.workstations).toBeInstanceOf(Array);
    expect(response.body.workstations.length).toBeGreaterThanOrEqual(1);
    expect(response.body.workstations[0]).toHaveProperty('id');
    expect(response.body.workstations[0]).toHaveProperty('code');
    expect(response.body.workstations[0]).toHaveProperty('name');
    expect(response.body.workstations[0]).toHaveProperty('workstationTypeId');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/workstations',
    );

    expect(response.status).toBe(401);
  });
});
