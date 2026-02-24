import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('List Files (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list files with pagination', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });
    await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .get('/v1/storage/files')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('files');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.files)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should filter files by folderId', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });
    await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .get('/v1/storage/files')
      .query({ folderId })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.files.length).toBeGreaterThanOrEqual(1);
    for (const file of response.body.files) {
      expect(file.folderId).toBe(folderId);
    }
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/storage/files');

    expect(response.status).toBe(401);
  });
});
