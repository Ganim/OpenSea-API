import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Workstation Types (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list workstation types', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a workstation type first
    await request(app.server)
      .post('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `WS Type List ${ts}`,
      });

    const response = await request(app.server)
      .get('/v1/production/workstation-types')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.workstationTypes).toBeInstanceOf(Array);
    expect(response.body.workstationTypes.length).toBeGreaterThanOrEqual(1);
    expect(response.body.workstationTypes[0]).toHaveProperty('id');
    expect(response.body.workstationTypes[0]).toHaveProperty('name');
    expect(response.body.workstationTypes[0]).toHaveProperty('isActive');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/workstation-types',
    );

    expect(response.status).toBe(401);
  });
});
