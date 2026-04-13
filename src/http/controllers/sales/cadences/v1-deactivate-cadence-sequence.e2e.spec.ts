import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Deactivate Cadence Sequence (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).patch(
      '/v1/sales/cadences/00000000-0000-0000-0000-000000000001/deactivate',
    );

    expect(response.status).toBe(401);
  });

  it('should deactivate a cadence sequence (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create and activate first
    const createRes = await request(app.server)
      .post('/v1/sales/cadences')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Cadencia Desativar ${ts}`,
        steps: [{ order: 1, type: 'EMAIL', delayDays: 0, config: {} }],
      });

    const cadenceId = createRes.body.cadenceSequence.id;

    await request(app.server)
      .patch(`/v1/sales/cadences/${cadenceId}/activate`)
      .set('Authorization', `Bearer ${token}`);

    // Deactivate
    const response = await request(app.server)
      .patch(`/v1/sales/cadences/${cadenceId}/deactivate`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.cadenceSequence).toBeDefined();
    expect(response.body.cadenceSequence.isActive).toBe(false);
  });
});
