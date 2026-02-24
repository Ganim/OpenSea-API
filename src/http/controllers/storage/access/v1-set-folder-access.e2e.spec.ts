import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Set Folder Access (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should set access rule for a user on a folder', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${folderId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        canRead: true,
        canWrite: true,
        canDelete: false,
        canShare: false,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('rule');
    expect(response.body.rule.folderId).toBe(folderId);
    expect(response.body.rule.userId).toBe(userId);
    expect(response.body.rule.canRead).toBe(true);
    expect(response.body.rule.canWrite).toBe(true);
    expect(response.body.rule.canDelete).toBe(false);
  });

  it('should return 400 without userId or groupId', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${folderId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      });

    expect(response.status).toBe(400);
  });

  it('should return error without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/folders/00000000-0000-0000-0000-000000000000/access')
      .send({
        userId: '00000000-0000-0000-0000-000000000001',
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      });

    expect([400, 401]).toContain(response.status);
  });
});
