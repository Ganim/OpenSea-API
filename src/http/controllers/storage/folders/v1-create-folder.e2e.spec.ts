import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Create Folder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should create a root folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/storage/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Root Folder ${timestamp}` });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('folder');
    expect(response.body.folder).toHaveProperty('id');
    expect(response.body.folder.name).toBe(`Root Folder ${timestamp}`);
    expect(response.body.folder.depth).toBe(0);
  });

  it('should create a subfolder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId: parentId } = await createStorageFolderE2E({ tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/storage/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `Sub Folder ${timestamp}`, parentId });

    expect(response.status).toBe(201);
    expect(response.body.folder.depth).toBe(1);
    expect(response.body.folder.parentId).toBe(parentId);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/folders')
      .send({ name: 'No Auth' });

    expect(response.status).toBe(401);
  });
});
