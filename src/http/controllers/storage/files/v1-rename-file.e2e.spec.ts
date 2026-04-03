import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Rename File (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should rename a file', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;
    const { folderId } = await createStorageFolderE2E({ tenantId });
    const { fileId } = await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
    });
    const newName = `renamed-file-${Date.now()}.txt`;

    const response = await request(app.server)
      .patch(`/v1/storage/files/${fileId}/rename`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: newName });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('file');
    expect(response.body.file.name).toBe(newName);
  });

  it('should return 404 for non-existent file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/storage/files/00000000-0000-0000-0000-000000000000/rename')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'new-name.txt' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .patch('/v1/storage/files/00000000-0000-0000-0000-000000000000/rename')
      .send({ name: 'new-name.txt' });

    expect(response.status).toBe(401);
  });
});
