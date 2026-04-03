import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Complete Multipart Upload (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });


  it('should reject disallowed MIME types', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/multipart/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'storage/fake-key',
        uploadId: 'fake-upload-id',
        parts: [{ partNumber: 1, etag: '"abc123"' }],
        fileName: 'malware.exe',
        mimeType: 'application/x-msdownload',
        fileSize: 50 * 1024 * 1024,
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('não permitido');
  });

  it('should validate required body fields', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/multipart/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/files/multipart/complete')
      .send({
        key: 'storage/fake-key',
        uploadId: 'fake-upload-id',
        parts: [{ partNumber: 1, etag: '"abc"' }],
        fileName: 'file.zip',
        mimeType: 'application/zip',
        fileSize: 100 * 1024 * 1024,
      });

    expect(response.status).toBe(401);
  });

  it('should reject attempt to complete with non-existent upload', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/files/multipart/complete')
      .set('Authorization', `Bearer ${token}`)
      .send({
        key: 'storage/non-existent-key',
        uploadId: 'non-existent-upload-id',
        parts: [{ partNumber: 1, etag: '"fake"' }],
        fileName: 'big-file.pdf',
        mimeType: 'application/pdf',
        fileSize: 60 * 1024 * 1024,
      });

    // Should fail because the upload doesn't exist in S3/local
    expect([400, 500]).toContain(response.status);
  });
});
