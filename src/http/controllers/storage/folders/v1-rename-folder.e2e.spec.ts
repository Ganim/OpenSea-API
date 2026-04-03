import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Rename Folder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should rename a folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const newName = `Renamed-${Date.now()}`;

    const response = await request(app.server)
      .patch(`/v1/storage/folders/${folderId}/rename`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: newName });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('folder');
    expect(response.body.folder.name).toBe(newName);
  });

  it('should return 404 for non-existent folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/storage/folders/00000000-0000-0000-0000-000000000000/rename')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .patch('/v1/storage/folders/00000000-0000-0000-0000-000000000000/rename')
      .send({ name: 'New Name' });

    expect(response.status).toBe(401);
  });
});
