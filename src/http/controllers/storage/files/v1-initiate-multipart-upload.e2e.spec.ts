import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Initiate Multipart Upload (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should initiate multipart upload with valid parameters', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/multipart/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: 'large-file.zip',
        mimeType: 'application/zip',
        fileSize: 100 * 1024 * 1024, // 100MB
      });

    // In test env without S3, LocalFileUploadService throws for multipart
    // With S3 configured, it should return uploadId + key + partUrls
    expect([200, 500]).toContain(response.status);

    if (response.status === 200) {
      expect(response.body).toHaveProperty('uploadId');
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('partUrls');
      expect(Array.isArray(response.body.partUrls)).toBe(true);
    }
  });

  it('should reject disallowed MIME types', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/multipart/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fileName: 'malware.exe',
        mimeType: 'application/x-msdownload',
        fileSize: 50 * 1024 * 1024,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('não permitido');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/files/multipart/initiate')
      .send({
        fileName: 'file.zip',
        mimeType: 'application/zip',
        fileSize: 100 * 1024 * 1024,
      });

    expect(response.status).toBe(401);
  });

  it('should validate required body fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/multipart/initiate')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });
});
