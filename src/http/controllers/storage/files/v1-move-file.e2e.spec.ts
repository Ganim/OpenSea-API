import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Move File (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should move a file to another folder', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId: sourceFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    const { folderId: targetFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId: sourceFolderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .patch(`/v1/storage/files/${fileId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ folderId: targetFolderId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('file');
    expect(response.body.file.folderId).toBe(targetFolderId);
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .patch('/v1/storage/files/00000000-0000-0000-0000-000000000000/move')
      .set('Authorization', `Bearer ${token}`)
      .send({ folderId });

    expect(response.status).toBe(404);
  });

  it('should return error without auth', async () => {
    const response = await request(app.server)
      .patch('/v1/storage/files/00000000-0000-0000-0000-000000000000/move')
      .send({ folderId: '00000000-0000-0000-0000-000000000001' });

    expect([400, 401]).toContain(response.status);
  });
});
