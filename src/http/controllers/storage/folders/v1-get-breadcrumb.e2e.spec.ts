import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Get Breadcrumb (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should get breadcrumb for a nested folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId: parentId } = await createStorageFolderE2E({ tenantId });
    const { folderId: childId } = await createStorageFolderE2E({
      tenantId,
      parentId,
    });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${childId}/breadcrumb`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('breadcrumb');
    expect(Array.isArray(response.body.breadcrumb)).toBe(true);
    expect(response.body.breadcrumb.length).toBeGreaterThanOrEqual(2);
  });

  it('should return 404 for non-existent folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get(
        '/v1/storage/folders/00000000-0000-0000-0000-000000000000/breadcrumb',
      )
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000/breadcrumb',
    );

    expect(response.status).toBe(401);
  });
});
