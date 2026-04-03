import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Restore File Version (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should restore a file to a previous version', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId, versionId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Upload a new version first so we have v1 to restore to
    await request(app.server)
      .post(`/v1/storage/files/${fileId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('version 2 content'), {
        filename: 'test-v2.txt',
        contentType: 'text/plain',
      });

    // Restore v1
    const response = await request(app.server)
      .post(`/v1/storage/files/${fileId}/versions/${versionId}/restore`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('file');
    expect(response.body).toHaveProperty('version');
  });

  it('should return error for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/storage/files/00000000-0000-0000-0000-000000000000/versions/00000000-0000-0000-0000-000000000001/restore',
      )
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });

  it('should return error without auth', async () => {
    const response = await request(app.server).post(
      '/v1/storage/files/00000000-0000-0000-0000-000000000000/versions/00000000-0000-0000-0000-000000000001/restore',
    );

    expect([400, 401]).toContain(response.status);
  });
});
