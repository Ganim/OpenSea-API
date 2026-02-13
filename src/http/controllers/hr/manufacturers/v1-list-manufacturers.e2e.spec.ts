import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List HR Manufacturers (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list manufacturers', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create a manufacturer first
    await request(app.server)
      .post('/v1/hr/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `List Mfg ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
        email: `listmfg${timestamp}@example.com`,
      });

    const response = await request(app.server)
      .get('/v1/hr/manufacturers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    expect(response.body[0]).toHaveProperty('id');
    expect(response.body[0]).toHaveProperty('legalName');
    expect(response.body[0]).toHaveProperty('type', 'MANUFACTURER');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get('/v1/hr/manufacturers');

    expect(response.status).toBe(401);
  });
});
