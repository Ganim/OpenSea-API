import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List HR Suppliers (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should list hr suppliers with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create supplier via API
    await request(app.server)
      .post('/v1/hr/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `HR Supplier ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
      });

    const response = await request(app.server)
      .get('/v1/hr/suppliers')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  it('should not list hr suppliers without auth token', async () => {
    const response = await request(app.server).get('/v1/hr/suppliers');

    expect(response.status).toBe(401);
  });
});
