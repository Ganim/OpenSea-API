import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createVolumeE2E } from '@/utils/tests/factories/stock/create-volume.e2e';

describe('List Volumes (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list volumes with pagination', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Create volumes using factory
    await createVolumeE2E(app, { token, name: 'Volume 1' });
    await createVolumeE2E(app, { token, name: 'Volume 2' });

    const response = await request(app.server)
      .get('/v1/volumes')
      .set('Authorization', `Bearer ${token}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('volumes');
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('totalPages');
    expect(Array.isArray(response.body.volumes)).toBe(true);
  });
});
