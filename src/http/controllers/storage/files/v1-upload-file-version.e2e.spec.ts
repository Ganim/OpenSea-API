import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Upload File Version (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload a new version of a file', async () => {
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
      .post(`/v1/storage/files/${fileId}/versions`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('updated file content v2'), {
        filename: 'test-document-v2.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('file');
    expect(response.body).toHaveProperty('version');
    expect(response.body.file.currentVersion).toBe(2);
    expect(response.body.version.version).toBe(2);
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/00000000-0000-0000-0000-000000000000/versions')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/files/00000000-0000-0000-0000-000000000000/versions')
      .attach('file', Buffer.from('content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(401);
  });
});
