import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('Close Volume (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should close a volume successfully', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { volumeId } = await createVolumeE2E(app, {
      token,
      name: 'Volume para Fechar',
    });

    const response = await request(app.server)
      .post(`/v1/volumes/${volumeId}/close`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('volume');
    expect(response.body.volume.status).toBe('CLOSED');
    expect(response.body.volume.closedAt).not.toBeNull();
  });
});
