import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('List Folder Contents (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list root folder contents', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get('/v1/storage/folders/root/contents')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('folders');
    expect(response.body).toHaveProperty('files');
    expect(response.body).toHaveProperty('total');
    expect(Array.isArray(response.body.folders)).toBe(true);
  });

  it('should list subfolder contents', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId: parentId } = await createStorageFolderE2E({ tenantId });
    await createStorageFolderE2E({ tenantId, parentId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${parentId}/contents`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.folders.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/root/contents',
    );

    expect(response.status).toBe(401);
  });
});
