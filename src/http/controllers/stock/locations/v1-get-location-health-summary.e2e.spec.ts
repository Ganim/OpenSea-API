import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Location Health Summary (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return the location health summary', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/locations/health-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('overallOccupancy');
    expect(response.body.overallOccupancy).toHaveProperty('used');
    expect(response.body.overallOccupancy).toHaveProperty('total');
    expect(response.body.overallOccupancy).toHaveProperty('percentage');
    expect(response.body).toHaveProperty('blockedBins');
    expect(response.body.blockedBins).toHaveProperty('count');
    expect(response.body).toHaveProperty('orphanedItems');
    expect(response.body.orphanedItems).toHaveProperty('count');
    expect(response.body).toHaveProperty('expiringItems');
    expect(response.body.expiringItems).toHaveProperty('count');
    expect(response.body.expiringItems).toHaveProperty('thresholdDays');
    expect(response.body).toHaveProperty('inconsistencies');
    expect(response.body.inconsistencies).toHaveProperty('count');
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/locations/health-summary',
    );

    expect(response.status).toBe(401);
  });
});
