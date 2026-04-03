import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Search Folders (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should search folders by name', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const uniqueName = `SearchableFolder-${Date.now()}`;
    await createStorageFolderE2E({ tenantId, name: uniqueName });

    const response = await request(app.server)
      .get('/v1/storage/folders/search')
      .query({ q: uniqueName })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('folders');
    expect(response.body.folders.length).toBeGreaterThanOrEqual(1);
    expect(response.body.folders[0].name).toBe(uniqueName);
  });

  it('should return empty array for no matches', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/folders/search')
      .query({ q: `nonexistent-folder-${Date.now()}` })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.folders).toEqual([]);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .get('/v1/storage/folders/search')
      .query({ q: 'test' });

    expect(response.status).toBe(401);
  });
});
