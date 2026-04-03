import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Apply Folder Template (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should apply a valid template to a user folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId: targetFolderId } = await createStorageFolderE2E({
      tenantId,
      isSystem: false,
    });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${targetFolderId}/apply-template`)
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'employee-documents' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('createdFolders');
    expect(response.body).toHaveProperty('skippedFolders');
    expect(Array.isArray(response.body.createdFolders)).toBe(true);
    expect(Array.isArray(response.body.skippedFolders)).toBe(true);
    // The 'employee-documents' template has 4 sub-folders
    expect(response.body.createdFolders.length).toBe(4);
    expect(response.body.skippedFolders).toEqual([]);
  });

  it('should skip folders that already exist in the target', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId: targetFolderId } = await createStorageFolderE2E({
      tenantId,
      isSystem: false,
    });

    // Pre-create one of the template sub-folders so it gets skipped
    await createStorageFolderE2E({
      tenantId,
      name: 'Documentos Pessoais',
      parentId: targetFolderId,
    });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${targetFolderId}/apply-template`)
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'employee-documents' });

    expect(response.status).toBe(200);
    expect(response.body.createdFolders.length).toBe(3);
    expect(response.body.skippedFolders).toContain('Documentos Pessoais');
  });

  it('should return 400 for invalid template id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId: targetFolderId } = await createStorageFolderE2E({
      tenantId,
      isSystem: false,
    });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${targetFolderId}/apply-template`)
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'non-existent-template' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 400 when applying template to a system folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const { folderId: systemFolderId } = await createStorageFolderE2E({
      tenantId,
      isSystem: true,
    });

    const response = await request(app.server)
      .post(`/v1/storage/folders/${systemFolderId}/apply-template`)
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'employee-documents' });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 404 for non-existent target folder', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/storage/folders/00000000-0000-0000-0000-000000000000/apply-template',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ templateId: 'employee-documents' });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post(
        '/v1/storage/folders/00000000-0000-0000-0000-000000000000/apply-template',
      )
      .send({ templateId: 'employee-documents' });

    expect(response.status).toBe(401);
  });
});
