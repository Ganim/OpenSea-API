import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';
import { randomBytes, randomUUID } from 'crypto';

describe('Revoke Share Link (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should revoke a share link', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });

    const shareLinkId = randomUUID();
    await prisma.storageShareLink.create({
      data: {
        id: shareLinkId,
        tenantId,
        fileId,
        token: randomBytes(32).toString('hex'),
        createdBy: userId,
      },
    });

    const response = await request(app.server)
      .delete(`/v1/storage/shares/${shareLinkId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);

    // Verify the link was deactivated in the database
    const revokedLink = await prisma.storageShareLink.findUnique({
      where: { id: shareLinkId },
    });
    expect(revokedLink?.isActive).toBe(false);
  });

  it('should return 404 for non-existent share link', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete(
        '/v1/storage/shares/00000000-0000-0000-0000-000000000000',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/storage/shares/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
