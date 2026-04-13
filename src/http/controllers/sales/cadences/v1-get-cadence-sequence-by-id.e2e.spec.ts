import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Cadence Sequence By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/sales/cadences/00000000-0000-0000-0000-000000000001',
    );

    expect(response.status).toBe(401);
  });

  it('should return 404 for non-existent cadence', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/sales/cadences/00000000-0000-0000-0000-000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should get a cadence sequence by ID (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const createRes = await request(app.server)
      .post('/v1/sales/cadences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Cadencia Detail ${ts}`,
        steps: [
          { order: 1, type: 'EMAIL', delayDays: 0, config: {} },
        ],
      });

    const cadenceId = createRes.body.cadenceSequence.id;

    const response = await request(app.server)
      .get(`/v1/sales/cadences/${cadenceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.cadenceSequence).toBeDefined();
    expect(response.body.cadenceSequence.id).toBe(cadenceId);
    expect(response.body.cadenceSequence.steps).toBeDefined();
  });
});
