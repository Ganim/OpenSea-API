import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Move Folder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should move a folder to a new parent', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId: targetParentId } = await createStorageFolderE2E({
      tenantId,
    });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .patch(`/v1/storage/folders/${folderId}/move`)
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: targetParentId });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('folder');
    expect(response.body.folder.parentId).toBe(targetParentId);
  });

  it('should return 404 for non-existent folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId: targetId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .patch('/v1/storage/folders/00000000-0000-0000-0000-000000000000/move')
      .set('Authorization', `Bearer ${token}`)
      .send({ parentId: targetId });

    expect(response.status).toBe(404);
  });

  it('should return error without auth', async () => {
    const response = await request(app.server)
      .patch('/v1/storage/folders/00000000-0000-0000-0000-000000000000/move')
      .send({ parentId: '00000000-0000-0000-0000-000000000001' });

    // May return 400 (body validation before auth) or 401
    expect([400, 401]).toContain(response.status);
  });
});
