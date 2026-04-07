import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Upload File (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should upload a file to a folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${folderId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('test file content'), {
        filename: 'test-document.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('file');
    expect(response.body.file.name).toBe('test-document.txt');
    expect(response.body.file.mimeType).toBe('text/plain');
    expect(response.body.file.folderId).toBe(folderId);
    expect(response.body.file.currentVersion).toBe(1);
  });

  it('should return error without a file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${folderId}/files`)
      .set('Authorization', `Bearer ${token}`)
      .field('dummy', ''); // Force multipart content-type so the handler parses it

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/folders/00000000-0000-0000-0000-000000000000/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/folders/00000000-0000-0000-0000-000000000000/files')
      .attach('file', Buffer.from('content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(401);
  });
});
