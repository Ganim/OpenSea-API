import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('List Folder Access (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list access rules for a folder', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });

    // First set an access rule
    await request(app.server)
      .post(`/v1/storage/folders/${folderId}/access`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        userId,
        canRead: true,
        canWrite: false,
        canDelete: false,
        canShare: false,
      });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}/access`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('rules');
    expect(Array.isArray(response.body.rules)).toBe(true);
    expect(response.body.rules.length).toBeGreaterThanOrEqual(1);
  });

  it('should return empty rules for folder without access rules', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}/access`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.rules).toEqual([]);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000/access',
    );

    expect(response.status).toBe(401);
  });
});
