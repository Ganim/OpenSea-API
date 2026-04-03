import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';

describe('Get Filter Folder Contents (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should return files matching the filter file type', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    // Create a filter folder with filterFileType
    const { folderId: filterFolderId } = await createStorageFolderE2E({
      tenantId,
      isFilter: true,
      filterFileType: 'DOCUMENT',
    });

    // Create a regular folder with a file of matching type
    const { folderId: regularFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    await createStorageFileE2E({
      tenantId,
      folderId: regularFolderId,
      uploadedBy: userId,
      fileType: 'DOCUMENT',
    });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${filterFolderId}/filter-contents`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('files');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.files)).toBe(true);
  });

  it('should return 400 for non-filter folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}/filter-contents`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000/filter-contents',
    );

    expect(response.status).toBe(401);
  });
});
