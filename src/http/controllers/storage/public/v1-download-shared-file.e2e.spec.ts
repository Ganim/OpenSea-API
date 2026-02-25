import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';
import { hash } from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';

describe('Download Shared File (E2E)', () => {
  let tenantId: string;
  let uploaderId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    uploaderId = randomUUID();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should download a shared file and increment download count', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const shareLinkId = randomUUID();

    await prisma.storageShareLink.create({
      data: {
        id: shareLinkId,
        tenantId,
        fileId,
        token: shareToken,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
    expect(typeof response.body.url).toBe('string');

    // Verify download count was incremented
    const updatedLink = await prisma.storageShareLink.findUnique({
      where: { id: shareLinkId },
    });
    expect(updatedLink?.downloadCount).toBe(1);
  });

  it('should download a password-protected file with correct password', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const hashedPassword = await hash('download-pass', 10);

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

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({ password: 'download-pass' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('url');
  });

  it('should return 403 when password is required but not provided', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: uploaderId,
    });

    const shareToken = randomBytes(32).toString('hex');
    const hashedPassword = await hash('secret-pass', 10);

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

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({});

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
    const hashedPassword = await hash('correct-pass', 10);

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

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({ password: 'wrong-pass' });

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

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({});

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

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({});

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
        maxDownloads: 3,
        downloadCount: 3,
        createdBy: uploaderId,
      },
    });

    const response = await request(app.server)
      .post(`/v1/public/shared/${shareToken}/download`)
      .send({});

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Download limit reached');
  });

  it('should return 404 for a non-existent token', async () => {
    const nonExistentToken = randomBytes(32).toString('hex');

    const response = await request(app.server)
      .post(`/v1/public/shared/${nonExistentToken}/download`)
      .send({});

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });
});
