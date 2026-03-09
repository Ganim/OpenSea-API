import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Upload Employee Photo (E2E)', () => {
  let tenantId: string;
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;

    // Create a minimal valid 100x100 JPEG for testing
    testImageBuffer = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 255, g: 0, b: 0 } },
    })
      .jpeg()
      .toBuffer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload employee photo with crop', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' })
      .field('cropX', '0')
      .field('cropY', '0')
      .field('cropWidth', '100')
      .field('cropHeight', '100');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('photoUrl');
    expect(response.body.photoUrl).toMatch(/\/v1\/storage\/files\/.+\/serve/);
  });

  it('should upload photo without crop (full image)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('photoUrl');
  });

  it('should return 400 without a file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    const response = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .field('cropX', '0');

    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const fakeId = '00000000-0000-0000-0000-000000000000';

    const response = await request(app.server)
      .post(`/v1/hr/employees/${fakeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/hr/employees/00000000-0000-0000-0000-000000000000/photo')
      .attach('file', testImageBuffer, { filename: 'photo.jpg', contentType: 'image/jpeg' });

    expect(response.status).toBe(401);
  });

  it('should replace old photo when uploading a new one', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const { employeeId } = await createEmployeeE2E({ tenantId });

    // First upload
    const first = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, { filename: 'photo1.jpg', contentType: 'image/jpeg' });

    expect(first.status).toBe(200);
    const firstUrl = first.body.photoUrl;

    // Second upload (should replace)
    const second = await request(app.server)
      .post(`/v1/hr/employees/${employeeId}/photo`)
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, { filename: 'photo2.jpg', contentType: 'image/jpeg' });

    expect(second.status).toBe(200);
    expect(second.body.photoUrl).not.toBe(firstUrl);
  });
});
