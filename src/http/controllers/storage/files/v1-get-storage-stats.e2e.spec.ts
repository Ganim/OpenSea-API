import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get Storage Stats (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return storage statistics', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('totalFiles');
    expect(response.body).toHaveProperty('totalSize');
    expect(response.body).toHaveProperty('filesByType');
    expect(response.body).toHaveProperty('usedStoragePercent');
    expect(typeof response.body.totalFiles).toBe('number');
    expect(typeof response.body.totalSize).toBe('number');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/storage/stats');

    expect(response.status).toBe(401);
  });
});
