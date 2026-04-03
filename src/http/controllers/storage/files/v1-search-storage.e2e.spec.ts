import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createStorageFileE2E } from '@/utils/tests/factories/storage/create-storage-file.e2e';
import { createStorageFolderE2E } from '@/utils/tests/factories/storage/create-storage-folder.e2e';

describe('Search Storage (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should search files and folders by query', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const searchableFileName = `searchable-report-${Date.now()}.pdf`;
    const searchableFolderName = `Searchable Folder ${Date.now()}`;

    const { folderId } = await createStorageFolderE2E({ tenantId });
    await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
      name: searchableFileName,
    });
    await createStorageFolderE2E({
      tenantId,
      name: searchableFolderName,
    });

    const response = await request(app.server)
      .get('/v1/storage/search')
      .query({ query: 'searchable' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('files');
    expect(response.body).toHaveProperty('folders');
    expect(response.body).toHaveProperty('totalFiles');
    expect(response.body).toHaveProperty('totalFolders');
    expect(Array.isArray(response.body.files)).toBe(true);
    expect(Array.isArray(response.body.folders)).toBe(true);
    expect(response.body.totalFiles).toBeGreaterThanOrEqual(1);
    expect(response.body.totalFolders).toBeGreaterThanOrEqual(1);
  });

  it('should filter search results by fileType', async () => {
    const auth = await createAndAuthenticateUser(app, { tenantId });
    const token = auth.token;
    const userId = auth.user.user.id;

    const uniqueSearchTerm = `typedfile-${Date.now()}`;
    const { folderId } = await createStorageFolderE2E({ tenantId });
    await createStorageFileE2E({
      tenantId,
      folderId,
      uploadedBy: userId,
      name: `${uniqueSearchTerm}.png`,
      mimeType: 'image/png',
      fileType: 'IMAGE',
    });

    const response = await request(app.server)
      .get('/v1/storage/search')
      .query({ query: uniqueSearchTerm, fileType: 'IMAGE' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totalFiles).toBeGreaterThanOrEqual(1);
    for (const file of response.body.files) {
      expect(file.fileType).toBe('IMAGE');
    }
  });

  it('should return empty results for non-matching query', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/search')
      .query({ query: 'zznonexistentxyz999' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.totalFiles).toBe(0);
    expect(response.body.totalFolders).toBe(0);
    expect(response.body.files).toEqual([]);
    expect(response.body.folders).toEqual([]);
  });

  it('should return 400 for query shorter than 2 characters', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/storage/search')
      .query({ query: 'x' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .get('/v1/storage/search')
      .query({ query: 'test' });

    expect(response.status).toBe(401);
  });
});
