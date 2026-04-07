import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Initialize Folders (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should initialize system folders for the tenant', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/storage/folders/initialize')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('folders');
    expect(response.body).toHaveProperty('message');
    expect(Array.isArray(response.body.folders)).toBe(true);
    expect(response.body.folders.length).toBeGreaterThan(0);
  });

  it('should be idempotent (calling twice succeeds)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    // First call
    await request(app.server)
      .post('/v1/storage/folders/initialize')
      .set('Authorization', `Bearer ${token}`);

    // Second call should also succeed
    const response = await request(app.server)
      .post('/v1/storage/folders/initialize')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('folders');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).post(
      '/v1/storage/folders/initialize',
    );

    expect(response.status).toBe(401);
  });
});
