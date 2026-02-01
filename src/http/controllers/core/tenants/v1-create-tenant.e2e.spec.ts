import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Create Tenant (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create a new tenant', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const uniqueSlug = `new-tenant-${Date.now()}`;

    const response = await request(app.server)
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `New Tenant ${Date.now()}`,
        slug: uniqueSlug,
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('tenant');
    expect(response.body.tenant).toHaveProperty('id');
    expect(response.body.tenant).toHaveProperty('name');
    expect(response.body.tenant.slug).toBe(uniqueSlug);
    expect(response.body.tenant.status).toBe('ACTIVE');
  });

  it('should return 400 for duplicate slug', async () => {
    const { token } = await createAndAuthenticateUser(app);

    const uniqueSlug = `dup-tenant-${Date.now()}`;

    await request(app.server)
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'First Tenant', slug: uniqueSlug });

    const response = await request(app.server)
      .post('/v1/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Second Tenant', slug: uniqueSlug });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without authentication', async () => {
    const response = await request(app.server)
      .post('/v1/tenants')
      .send({ name: 'Unauthorized Tenant' });

    expect(response.status).toBe(401);
  });
});
