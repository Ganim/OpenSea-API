import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Empty Trash (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should permanently delete all soft-deleted files and folders', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const { folderId: deletedFolderId } = await createStorageFolderE2E({
      tenantId,
      name: 'Folder To Delete Permanently',
    });

    // Soft-delete the file and the second folder
    await prisma.storageFile.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });
    await prisma.storageFolder.update({
      where: { id: deletedFolderId },
      data: { deletedAt: new Date() },
    });

    const response = await request(app.server)
      .delete('/v1/storage/trash/empty')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('deletedFiles');
    expect(response.body).toHaveProperty('deletedFolders');
    expect(response.body.deletedFiles).toBeGreaterThanOrEqual(1);
    expect(response.body.deletedFolders).toBeGreaterThanOrEqual(1);

    // Verify the file was permanently deleted from the database
    const permanentlyDeletedFile = await prisma.storageFile.findUnique({
      where: { id: fileId },
    });
    expect(permanentlyDeletedFile).toBeNull();

    // Verify the folder was permanently deleted from the database
    const permanentlyDeletedFolder = await prisma.storageFolder.findUnique({
      where: { id: deletedFolderId },
    });
    expect(permanentlyDeletedFolder).toBeNull();
  });

  it('should return zero counts when trash is empty', async () => {
    const { tenantId: emptyTenantId } = await createAndSetupTenant();
    const { token } = await createAndAuthenticateUser(app, {
      tenantId: emptyTenantId,
    });

    const response = await request(app.server)
      .delete('/v1/storage/trash/empty')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.deletedFiles).toBe(0);
    expect(response.body.deletedFolders).toBe(0);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/storage/trash/empty',
    );

    expect(response.status).toBe(401);
  });
});
