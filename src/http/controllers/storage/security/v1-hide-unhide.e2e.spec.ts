import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Storage Security — Hide/Unhide (E2E)', () => {
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

  // ─── Hide ──────────────────────────────────────────────
  describe('POST /v1/storage/security/hide', () => {
    it('should hide a file', async () => {
      const { fileId } = await createStorageFileE2E({
        tenantId,
        folderId,
        uploadedBy: userId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/hide')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: fileId, itemType: 'file' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('ocultado');
    });

    it('should hide a folder', async () => {
      const { folderId: targetFolderId } = await createStorageFolderE2E({
        tenantId,
      });

      const response = await request(app.server)
        .post('/v1/storage/security/hide')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: targetFolderId, itemType: 'folder' });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('ocultado');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/hide')
        .set('Authorization', `Bearer ${token}`)
        .send({
          itemId: '00000000-0000-0000-0000-000000000000',
          itemType: 'file',
        });

      expect(response.status).toBe(404);
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/hide')
        .send({
          itemId: '00000000-0000-0000-0000-000000000000',
          itemType: 'file',
        });

      expect(response.status).toBe(401);
    });
  });

  // ─── Unhide ────────────────────────────────────────────
  describe('POST /v1/storage/security/unhide', () => {
    it('should unhide a file', async () => {
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

    it('should unhide a folder', async () => {
      const { folderId: targetFolderId } = await createStorageFolderE2E({
        tenantId,
      });

      // Hide first
      await request(app.server)
        .post('/v1/storage/security/hide')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: targetFolderId, itemType: 'folder' });

      // Unhide
      const response = await request(app.server)
        .post('/v1/storage/security/unhide')
        .set('Authorization', `Bearer ${token}`)
        .send({ itemId: targetFolderId, itemType: 'folder' });

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
  });

  // ─── Verify Security Key ──────────────────────────────
  describe('POST /v1/storage/security/verify-key', () => {
    it('should return valid: false when user has no security key', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/verify-key')
        .set('Authorization', `Bearer ${token}`)
        .send({ key: 'any-key' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);
    });

    it('should return valid: true for correct security key', async () => {
      const { hash } = await import('bcryptjs');
      const securityKeyHash = await hash('my-secret-key', 6);

      const { prisma: prismaClient } = await import('@/lib/prisma');
      await prismaClient.tenantUser.updateMany({
        where: { userId, tenantId },
        data: { securityKeyHash },
      });

      const response = await request(app.server)
        .post('/v1/storage/security/verify-key')
        .set('Authorization', `Bearer ${token}`)
        .send({ key: 'my-secret-key' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(true);

      // Clean up
      await prismaClient.tenantUser.updateMany({
        where: { userId, tenantId },
        data: { securityKeyHash: null },
      });
    });

    it('should return valid: false for incorrect security key', async () => {
      const { hash } = await import('bcryptjs');
      const securityKeyHash = await hash('correct-key', 6);

      const { prisma: prismaClient } = await import('@/lib/prisma');
      await prismaClient.tenantUser.updateMany({
        where: { userId, tenantId },
        data: { securityKeyHash },
      });

      const response = await request(app.server)
        .post('/v1/storage/security/verify-key')
        .set('Authorization', `Bearer ${token}`)
        .send({ key: 'wrong-key' });

      expect(response.status).toBe(200);
      expect(response.body.valid).toBe(false);

      // Clean up
      await prismaClient.tenantUser.updateMany({
        where: { userId, tenantId },
        data: { securityKeyHash: null },
      });
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.server)
        .post('/v1/storage/security/verify-key')
        .send({ key: 'any-key' });

      expect(response.status).toBe(401);
    });
  });
});
