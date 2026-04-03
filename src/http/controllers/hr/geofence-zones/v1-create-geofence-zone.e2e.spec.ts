import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Geofence Zone (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a geofence zone', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/hr/geofence-zones')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: "Office Zone", latitude: -23.55, longitude: -46.63, radiusMeters: 100 });

    expect(response.status).not.toBe(401);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app.server)
      .post('/v1/hr/geofence-zones')
      .send({ name: "Office Zone", latitude: -23.55, longitude: -46.63, radiusMeters: 100 });

    expect(response.status).toBe(401);
  });
});
