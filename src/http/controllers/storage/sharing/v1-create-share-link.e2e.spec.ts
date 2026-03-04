import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Create Share Link (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a share link for a file', async () => {
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
      .post(`/v1/storage/files/${fileId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('token');
    expect(response.body.fileId).toBe(fileId);
    expect(response.body.tenantId).toBe(tenantId);
    expect(response.body.isActive).toBe(true);
    expect(response.body.downloadCount).toBe(0);
    expect(response.body.expiresAt).toBeNull();
    expect(response.body.maxDownloads).toBeNull();
  });

  it('should create a share link with expiration and max downloads', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);

    const response = await request(app.server)
      .post(`/v1/storage/files/${fileId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        expiresAt: futureDate.toISOString(),
        maxDownloads: 10,
      });

    expect(response.status).toBe(201);
    expect(response.body.maxDownloads).toBe(10);
    expect(response.body.expiresAt).not.toBeNull();
  });

  it('should create a share link with a password', async () => {
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
      .post(`/v1/storage/files/${fileId}/share`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        password: 'secret1234',
      });

    expect(response.status).toBe(201);
    expect(response.body.isActive).toBe(true);
    expect(response.body.token).toBeDefined();
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/00000000-0000-0000-0000-000000000000/share')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/files/00000000-0000-0000-0000-000000000000/share')
      .send({});

    expect(response.status).toBe(401);
  });
});
