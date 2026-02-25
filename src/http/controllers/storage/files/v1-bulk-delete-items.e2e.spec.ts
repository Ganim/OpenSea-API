import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Bulk Delete Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should bulk-delete files and folders', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId: folderToDeleteId } = await createStorageFolderE2E({
      tenantId,
    });
    const { folderId: fileParentFolderId } = await createStorageFolderE2E({
      tenantId,
    });
    const { fileId: fileToDeleteId } = await createStorageFileE2E({
      tenantId,
      folderId: fileParentFolderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .post('/v1/storage/bulk/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [fileToDeleteId],
        folderIds: [folderToDeleteId],
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deletedFiles');
    expect(response.body).toHaveProperty('deletedFolders');
    expect(response.body).toHaveProperty('errors');
    expect(response.body.deletedFiles).toBe(1);
    expect(response.body.deletedFolders).toBe(1);
    expect(response.body.errors).toEqual([]);

    const deletedFile = await prisma.storageFile.findUnique({
      where: { id: fileToDeleteId },
    });
    expect(deletedFile?.deletedAt).not.toBeNull();

    const deletedFolder = await prisma.storageFolder.findUnique({
      where: { id: folderToDeleteId },
    });
    expect(deletedFolder?.deletedAt).not.toBeNull();
  });

  it('should return 400 when no items are provided', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/bulk/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [],
        folderIds: [],
      });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return errors for non-existent items without failing entirely', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId: existingFileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const response = await request(app.server)
      .post('/v1/storage/bulk/delete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileIds: [existingFileId, '00000000-0000-0000-0000-000000000000'],
        folderIds: [],
      });

    expect(response.status).toBe(200);
    expect(response.body.deletedFiles).toBe(1);
    expect(response.body.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/bulk/delete')
      .send({
        fileIds: ['00000000-0000-0000-0000-000000000000'],
        folderIds: [],
      });

    expect(response.status).toBe(401);
  });
});
