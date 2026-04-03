import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Storage Security (E2E)', () => {
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


  // ─── Protect ────────────────────────────────────────────
  describe('POST /v1/storage/security/protect', () => {
    it('should protect a file with a password', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/protect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'test1234' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('protegido');
    });

    it('should protect a folder with a password', async () => {
      const { folderId: targetFolderId } = await createStorageFolderE2E({
        tenantId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/protect')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId: targetFolderId,
          itemType: 'folder',
          password: 'secret123',
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('protegido');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/protect')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId: '00000000-0000-0000-0000-000000000000',
          itemType: 'file',
          password: 'test1234',
        });

      expect(response.status).toBe(404);
    });

    it('should return 400 for password too short', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/protect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'ab' });

      // Zod validation returns 400
      expect(response.status).toBe(400);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/protect')
        .send({
          itemId: '00000000-0000-0000-0000-000000000000',
          itemType: 'file',
          password: 'test1234',
        });

      expect(response.status).toBe(401);
    });
  });

  // ─── Verify ─────────────────────────────────────────────
  describe('POST /v1/storage/security/verify', () => {
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

    it('should return valid: true for unprotected file', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'any' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);
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
  });

  // ─── Unprotect ──────────────────────────────────────────
  describe('POST /v1/storage/security/unprotect', () => {
    it('should unprotect a file with correct password', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      // Protect first
      await request(app.server)
        .post('/v1/storage/security/protect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'remove-me' });

      // Unprotect
      const response = await request(app.server)
        .post('/v1/storage/security/unprotect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'remove-me' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('removida');

      // Verify it's now unprotected
      const verifyResponse = await request(app.server)
        .post('/v1/storage/security/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'any' });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.valid).toBe(true);
    });

    it('should return 400 for incorrect password', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      // Protect
      await request(app.server)
        .post('/v1/storage/security/protect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'my-pass' });

      // Try to unprotect with wrong password
      const response = await request(app.server)
        .post('/v1/storage/security/unprotect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'wrong' });

      expect(response.status).toBe(400);
    });

    it('should return 400 for unprotected file', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/unprotect')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file', password: 'test' });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/unprotect')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId: '00000000-0000-0000-0000-000000000000',
          itemType: 'folder',
          password: 'test',
        });

      expect(response.status).toBe(404);
    });
  });
});
