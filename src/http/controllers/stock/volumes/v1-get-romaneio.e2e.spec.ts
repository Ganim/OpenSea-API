import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('Get Romaneio (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get romaneio for a volume', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { volumeId } = await createVolumeE2E(app, {
      token,
      name: 'Volume para Romaneio',
    });

    const response = await request(app.server)
      .get(`/v1/volumes/${volumeId}/romaneio`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('romaneio');
    expect(response.body.romaneio).toHaveProperty('volumeId');
    expect(response.body.romaneio).toHaveProperty('volumeCode');
    expect(response.body.romaneio).toHaveProperty('totalItems');
    expect(response.body.romaneio).toHaveProperty('items');
    expect(response.body.romaneio).toHaveProperty('generatedAt');
  });
});
