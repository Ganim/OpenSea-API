import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Get File Activity (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return activity logs for a file', async () => {
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
      .get(`/v1/storage/files/${fileId}/activity`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('logs');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.logs)).toBe(true);
    expect(response.body.meta).toHaveProperty('total');
    expect(response.body.meta).toHaveProperty('page');
    expect(response.body.meta).toHaveProperty('limit');
    expect(response.body.meta).toHaveProperty('pages');
  });

  it('should return empty logs for a file with no activity', async () => {
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
      .get(`/v1/storage/files/${fileId}/activity`)
      .query({ page: 1, limit: 10 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.logs).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });

  it('should return 200 even for a non-existent file id (empty logs)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Activity endpoint queries audit logs by entityId, so a non-existent file
    // simply returns empty logs rather than 404
    const response = await request(app.server)
      .get('/v1/storage/files/00000000-0000-0000-0000-000000000000/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.logs).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/files/00000000-0000-0000-0000-000000000000/activity',
    );

    expect(response.status).toBe(401);
  });
});
