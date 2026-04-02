import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Unhide Item (E2E)', () => {
  let tenantId: string;
  let token: string;
  let userId: string;
  let folderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
    userId = auth.user.user.id;

    const { folderId: fid } = await createStorageFolderE2E({ tenantId });
    folderId = fid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should unhide a previously hidden file', async () => {
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Hide first
    await request(app.server)
      .post('/v1/storage/security/hide')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: fileId, itemType: 'file' });

    // Unhide
    const response = await request(app.server)
      .post('/v1/storage/security/unhide')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: fileId, itemType: 'file' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('revelado');
  });

  it('should return 404 for non-existent item', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/unhide')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: '00000000-0000-0000-0000-000000000000',
        itemType: 'folder',
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/unhide')
      .send({
        itemId: '00000000-0000-0000-0000-000000000000',
        itemType: 'file',
      });

    expect(response.status).toBe(401);
  });
});
