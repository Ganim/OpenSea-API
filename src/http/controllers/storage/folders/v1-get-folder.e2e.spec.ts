import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Get Folder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should get a folder by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId, folder } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.folder.id).toBe(folderId);
    expect(response.body.folder.name).toBe(folder.name);
  });

  it('should return 404 for non-existent folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/folders/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
