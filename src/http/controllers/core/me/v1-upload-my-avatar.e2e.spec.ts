import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createEmployeeE2E } from '@/utils/tests/factories/hr/create-employee.e2e';

describe('Upload My Avatar (E2E)', () => {
  let tenantId: string;
  let testImageBuffer: Buffer;

  beforeAll(async () => {
    await app.ready();
    const tenant = await createAndSetupTenant();
    tenantId = tenant.tenantId;

    testImageBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should upload avatar for user without linked employee', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      })
      .field('cropX', '0')
      .field('cropY', '0')
      .field('cropWidth', '100')
      .field('cropHeight', '100');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('avatarUrl');
    expect(response.body.avatarUrl).toMatch(/\/v1\/storage\/files\/.+\/serve/);
  });

  it('should return 403 for user linked to an employee', async () => {
    const { token, user } = await createAndAuthenticateUser(app, { tenantId });

    // Link the user to an employee
    await createEmployeeE2E({
      tenantId,
      userId: user.user.id,
      fullName: 'Linked Employee',
    });

    const response = await request(app.server)
      .post('/v1/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('RH');
  });

  it('should return 400 without a file', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .field('cropX', '0');

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/me/avatar')
      .attach('file', testImageBuffer, {
        filename: 'avatar.jpg',
        contentType: 'image/jpeg',
      });

    expect(response.status).toBe(401);
  });

  it('should replace old avatar when uploading a new one', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // First upload
    const first = await request(app.server)
      .post('/v1/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, {
        filename: 'avatar1.jpg',
        contentType: 'image/jpeg',
      });

    expect(first.status).toBe(200);
    const firstUrl = first.body.avatarUrl;

    // Second upload (should replace)
    const second = await request(app.server)
      .post('/v1/me/avatar')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', testImageBuffer, {
        filename: 'avatar2.jpg',
        contentType: 'image/jpeg',
      });

    expect(second.status).toBe(200);
    expect(second.body.avatarUrl).not.toBe(firstUrl);
  });
});
