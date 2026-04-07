import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Restore Folder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should restore a soft-deleted folder', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;

    const { folderId } = await createStorageFolderE2E({ tenantId });

    // Soft-delete the folder
    await prisma.storageFolder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() },
    });

    const response = await request(app.server)
      .post(`/v1/storage/trash/restore-folder/${folderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('folder');
    expect(response.body.folder.id).toBe(folderId);

    // Verify the folder is no longer soft-deleted
    const restoredFolder = await prisma.storageFolder.findUnique({
      where: { id: folderId },
    });
    expect(restoredFolder?.deletedAt).toBeNull();
  });

  it('should also restore files inside the deleted folder', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Soft-delete both the folder and the file inside it
    await prisma.storageFolder.update({
      where: { id: folderId },
      data: { deletedAt: new Date() },
    });
    await prisma.storageFile.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    const response = await request(app.server)
      .post(`/v1/storage/trash/restore-folder/${folderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.folder.id).toBe(folderId);

    // Verify the file inside the folder was also restored
    const restoredFile = await prisma.storageFile.findUnique({
      where: { id: fileId },
    });
    expect(restoredFile?.deletedAt).toBeNull();
  });

  it('should return 404 for non-existent folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/storage/trash/restore-folder/00000000-0000-0000-0000-000000000000',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 for a folder that is not deleted', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId } = await createStorageFolderE2E({ tenantId });

    // Folder is active (not deleted), so restore should return 404
    const response = await request(app.server)
      .post(`/v1/storage/trash/restore-folder/${folderId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/storage/trash/restore-folder/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
