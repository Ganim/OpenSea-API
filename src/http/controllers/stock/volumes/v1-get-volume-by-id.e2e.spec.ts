import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('Get Volume By ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a volume by ID', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { volumeId } = await createVolumeE2E(app, {
      token,
      name: 'Volume para Busca',
    });

    const response = await request(app.server)
      .get(`/v1/volumes/${volumeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('volume');
    expect(response.body.volume.id).toBe(volumeId);
    expect(response.body.volume.name).toBe('Volume para Busca');
  });
});
