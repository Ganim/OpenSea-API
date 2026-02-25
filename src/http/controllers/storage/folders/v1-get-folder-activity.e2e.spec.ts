import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Get Folder Activity (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return activity logs for a folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}/activity`)
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

  it('should support pagination parameters', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}/activity`)
      .query({ page: 1, limit: 5 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(5);
  });

  it('should return 200 with empty logs for non-existent folder id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // Activity endpoint queries audit logs by entityId, so a non-existent folder
    // simply returns empty logs rather than 404
    const response = await request(app.server)
      .get('/v1/storage/folders/00000000-0000-0000-0000-000000000000/activity')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.logs).toEqual([]);
    expect(response.body.meta.total).toBe(0);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000/activity',
    );

    expect(response.status).toBe(401);
  });
});
