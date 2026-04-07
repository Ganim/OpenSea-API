import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Bulk Move Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should bulk-move files and folders to a target folder', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId: sourceFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    const { folderId: folderToMoveId } = await createStorageFolderE2E({
      tenantId,
    });
    const { folderId: targetFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    const { fileId: fileToMoveId } = await createStorageFileE2E({
      tenantId,
      folderId: sourceFolderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .post('/v1/storage/bulk/move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [fileToMoveId],
        folderIds: [folderToMoveId],
        targetFolderId,
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('movedFiles');
    expect(response.body).toHaveProperty('movedFolders');
    expect(response.body).toHaveProperty('errors');
    expect(response.body.movedFiles).toBe(1);
    expect(response.body.movedFolders).toBe(1);
    expect(response.body.errors).toEqual([]);
  });

  it('should bulk-move files to root (targetFolderId null)', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId: sourceFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    const { fileId: fileToMoveId } = await createStorageFileE2E({
      tenantId,
      folderId: sourceFolderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .post('/v1/storage/bulk/move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [fileToMoveId],
        folderIds: [],
        targetFolderId: null,
      });

    expect(response.status).toBe(200);
    expect(response.body.movedFiles).toBe(1);
  });

  it('should return 400 when no items are provided', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId: targetFolderId } = await createStorageFolderE2E({
      tenantId,
    });

    const response = await request(app.server)
      .post('/v1/storage/bulk/move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [],
        folderIds: [],
        targetFolderId,
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 when target folder does not exist', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .post('/v1/storage/bulk/move')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [fileId],
        folderIds: [],
        targetFolderId: '00000000-0000-0000-0000-000000000000',
      });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/bulk/move')
      .send({
        fileIds: ['00000000-0000-0000-0000-000000000000'],
        folderIds: [],
        targetFolderId: null,
      });

    expect(response.status).toBe(401);
  });
});
