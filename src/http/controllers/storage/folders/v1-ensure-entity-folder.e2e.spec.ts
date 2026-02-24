import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Ensure Entity Folder (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create entity folders', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const entityId = `entity-${Date.now()}`;

    const response = await request(app.server)
      .post('/v1/storage/folders/ensure-entity')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'employee',
        entityId,
        entityName: 'John Doe',
      });

    expect([200, 201]).toContain(response.status);
    expect(response.body).toHaveProperty('folders');
    expect(Array.isArray(response.body.folders)).toBe(true);
  });

  it('should be idempotent (calling twice succeeds)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const entityId = `entity-idem-${Date.now()}`;

    // First call
    await request(app.server)
      .post('/v1/storage/folders/ensure-entity')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'employee',
        entityId,
        entityName: 'Jane Doe',
      });

    // Second call should also succeed
    const response = await request(app.server)
      .post('/v1/storage/folders/ensure-entity')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entityType: 'employee',
        entityId,
        entityName: 'Jane Doe',
      });

    expect([200, 201]).toContain(response.status);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post('/v1/storage/folders/ensure-entity')
      .send({
        entityType: 'employee',
        entityId: 'test-id',
        entityName: 'Test',
      });

    expect(response.status).toBe(401);
  });
});
