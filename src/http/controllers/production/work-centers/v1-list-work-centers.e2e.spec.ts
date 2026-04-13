import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Work Centers (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list work centers', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a work center first
    await request(app.server)
      .post('/v1/production/work-centers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: `WC-LIST-${ts}`,
        name: `Work Center List ${ts}`,
      });

    const response = await request(app.server)
      .get('/v1/production/work-centers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.workCenters).toBeInstanceOf(Array);
    expect(response.body.workCenters.length).toBeGreaterThanOrEqual(1);
    expect(response.body.workCenters[0]).toHaveProperty('id');
    expect(response.body.workCenters[0]).toHaveProperty('code');
    expect(response.body.workCenters[0]).toHaveProperty('name');
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server).get(
      '/v1/production/work-centers',
    );

    expect(response.status).toBe(401);
  });
});
