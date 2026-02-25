import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';
import { randomBytes, randomUUID } from 'crypto';

describe('List Share Links (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list share links for a file', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    // Create two share links directly via Prisma
    await prisma.storageShareLink.createMany({
      data: [
        {
          id: randomUUID(),
          tenantId,
          fileId,
          token: randomBytes(32).toString('hex'),
          createdBy: userId,
        },
        {
          id: randomUUID(),
          tenantId,
          fileId,
          token: randomBytes(32).toString('hex'),
          createdBy: userId,
        },
      ],
    });

    const response = await request(app.server)
      .get(`/v1/storage/files/${fileId}/shares`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(2);

    for (const shareLink of response.body) {
      expect(shareLink.fileId).toBe(fileId);
      expect(shareLink.tenantId).toBe(tenantId);
      expect(shareLink).toHaveProperty('token');
      expect(shareLink).toHaveProperty('isActive');
      expect(shareLink).toHaveProperty('downloadCount');
    }
  });

  it('should return an empty array for a file with no share links', async () => {
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
      .get(`/v1/storage/files/${fileId}/shares`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(0);
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(
        '/v1/storage/files/00000000-0000-0000-0000-000000000000/shares',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/files/00000000-0000-0000-0000-000000000000/shares',
    );

    expect(response.status).toBe(401);
  });
});
