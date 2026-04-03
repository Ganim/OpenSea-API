import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Restore File (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should restore a soft-deleted file', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Soft-delete the file
    await prisma.storageFile.update({
      where: { id: fileId },
      data: { deletedAt: new Date() },
    });

    const response = await request(app.server)
      .post(`/v1/storage/trash/restore-file/${fileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('file');
    expect(response.body.file.id).toBe(fileId);

    // Verify the file is no longer soft-deleted
    const restoredFile = await prisma.storageFile.findUnique({
      where: { id: fileId },
    });
    expect(restoredFile?.deletedAt).toBeNull();
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/storage/trash/restore-file/00000000-0000-0000-0000-000000000000',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 404 for a file that is not deleted', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // File is active (not deleted), so restore should return 404
    const response = await request(app.server)
      .post(`/v1/storage/trash/restore-file/${fileId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/storage/trash/restore-file/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
