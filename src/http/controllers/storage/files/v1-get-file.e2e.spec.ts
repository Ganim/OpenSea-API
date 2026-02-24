import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Get File (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get a file by id with versions', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId, file } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .get(`/v1/storage/files/${fileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('file');
    expect(response.body).toHaveProperty('versions');
    expect(response.body.file.id).toBe(fileId);
    expect(response.body.file.name).toBe(file.name);
    expect(Array.isArray(response.body.versions)).toBe(true);
    expect(response.body.versions.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/files/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/files/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
