import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Upload File to Root (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should upload a file to root (no folder)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('root file content'), {
        filename: 'root-file.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('file');
    expect(response.body.file.name).toBe('root-file.txt');
    expect(response.body.file.mimeType).toBe('text/plain');
    expect(response.body.file.folderId).toBeNull();
    expect(response.body.file.currentVersion).toBe(1);
  });

  it('should return 400 without a file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files')
      .set('Authorization', `Bearer ${token}`)
      .field('dummy', '');

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/files')
      .attach('file', Buffer.from('content'), {
        filename: 'test.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(401);
  });
});
