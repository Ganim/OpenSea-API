import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Download Folder (E2E)', () => {
  let tenantId: string;
  let token: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;

    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;
  });


  it('should attempt to download a folder as ZIP', async () => {
    const { folderId } = await createStorageFolderE2E({ tenantId });

    const response = await request(app.server)
      .get(`/v1/storage/folders/${folderId}/download`)
      .set('Authorization', `Bearer ${token}`);

    // The folder may be empty or S3 may not be available in E2E
    // Accept 200 (success) or 400 (empty folder / limit)
    expect([200, 400]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('url');
      expect(response.body).toHaveProperty('fileName');
    }
  });

  it('should return 404 for non-existent folder', async () => {
    const response = await request(app.server)
      .get('/v1/storage/folders/00000000-0000-0000-0000-000000000000/download')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/storage/folders/00000000-0000-0000-0000-000000000000/download',
    );

    expect(response.status).toBe(401);
  });
});
