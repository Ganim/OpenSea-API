import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Verify Protection (E2E)', () => {
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


  it('should return valid: true for correct password', async () => {
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Protect first
    await request(app.server)
      .post('/v1/storage/security/protect')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: fileId, itemType: 'file', password: 'verify-me' });

    // Verify
    const response = await request(app.server)
      .post('/v1/storage/security/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: fileId, itemType: 'file', password: 'verify-me' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(true);
  });

  it('should return valid: false for incorrect password', async () => {
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Protect
    await request(app.server)
      .post('/v1/storage/security/protect')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: fileId, itemType: 'file', password: 'correct-pass' });

    // Verify with wrong password
    const response = await request(app.server)
      .post('/v1/storage/security/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ itemId: fileId, itemType: 'file', password: 'wrong-pass' });

    expect(response.status).toBe(200);
    expect(response.body.valid).toBe(false);
  });

  it('should return 404 for non-existent file', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: '00000000-0000-0000-0000-000000000000',
        itemType: 'file',
        password: 'test',
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/security/verify')
      .send({
        itemId: '00000000-0000-0000-0000-000000000000',
        itemType: 'file',
        password: 'test',
      });

    expect(response.status).toBe(401);
  });
});
