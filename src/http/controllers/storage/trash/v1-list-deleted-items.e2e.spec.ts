import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('List Deleted Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should list soft-deleted files and folders', async () => {
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
      name: 'Deleted Folder',
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
      .get('/v1/storage/trash')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('files');
    expect(response.body).toHaveProperty('folders');
    expect(response.body).toHaveProperty('totalFiles');
    expect(response.body).toHaveProperty('totalFolders');
    expect(Array.isArray(response.body.files)).toBe(true);
    expect(Array.isArray(response.body.folders)).toBe(true);
    expect(response.body.totalFiles).toBeGreaterThanOrEqual(1);
    expect(response.body.totalFolders).toBeGreaterThanOrEqual(1);
  });

  it('should return empty lists when no items are deleted', async () => {
    const { tenantId: emptyTenantId } = await createAndSetupTenant();
    const { token } = await createAndAuthenticateUser(app, {
      tenantId: emptyTenantId,
    });

    const response = await request(app.server)
      .get('/v1/storage/trash')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.files).toHaveLength(0);
    expect(response.body.folders).toHaveLength(0);
    expect(response.body.totalFiles).toBe(0);
    expect(response.body.totalFolders).toBe(0);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/storage/trash');

    expect(response.status).toBe(401);
  });
});
