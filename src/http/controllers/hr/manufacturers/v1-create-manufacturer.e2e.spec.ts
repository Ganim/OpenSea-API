import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create HR Manufacturer (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create hr manufacturer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/hr/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `HR Manufacturer ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
        email: `hrmanufacturer${timestamp}@example.com`,
        countryOfOrigin: 'Brazil',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('legalName');
    expect(response.body).toHaveProperty('type', 'MANUFACTURER');
  });

  it('should not create hr manufacturer without auth token', async () => {
    const response = await request(app.server)
      .post('/v1/hr/manufacturers')
      .send({
        legalName: 'Unauthorized Manufacturer',
      });

    expect(response.status).toBe(401);
  });
});
