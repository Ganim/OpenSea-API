import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';
import { hash } from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

describe('Access Shared File (E2E)', () => {
  let tenantId: string;
  let uploaderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    uploaderId = randomUUID();
  });

  it('should access a shared file via public link', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
      name: 'shared-document.pdf',
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
      size: 2048,
    });

    const shareToken = randomBytes(32).toString('hex');
    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.file).toEqual({
      name: 'shared-document.pdf',
      size: 2048,
      mimeType: 'application/pdf',
      fileType: 'DOCUMENT',
    });
    expect(response.body.link).toHaveProperty('downloadCount');
    expect(response.body.link).toHaveProperty('expiresAt');
    expect(response.body.link).toHaveProperty('maxDownloads');
  });

  it('should access a password-protected shared file with correct password', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const hashedPassword = await hash('my-secret', 10);

    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        password: hashedPassword,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}?password=my-secret`,
    );

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('file');
    expect(response.body).toHaveProperty('link');
  });

  it('should return 403 when password is required but not provided', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const hashedPassword = await hash('my-secret', 10);

    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        password: hashedPassword,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Password is required');
  });

  it('should return 403 when password is incorrect', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const hashedPassword = await hash('correct-password', 10);

    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        password: hashedPassword,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}?password=wrong-password`,
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Invalid password');
  });

  it('should return 403 for an expired share link', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        expiresAt: pastDate,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('expired');
  });

  it('should return 403 for a revoked share link', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');

    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        isActive: false,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('revoked');
  });

  it('should return 403 when download limit has been reached', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');

    await prisma.storageShareLink.create({
      data: {
        id: randomUUID(),
        tenantId,
        fileId,
        token: shareToken,
        maxDownloads: 5,
        downloadCount: 5,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server).get(
      `/v1/public/shared/${shareToken}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Download limit reached');
  });

  it('should return 404 for a non-existent token', async () => {
    const nonExistentToken = randomBytes(32).toString('hex');

    const response = await request(app.server).get(
      `/v1/public/shared/${nonExistentToken}`,
    );

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
