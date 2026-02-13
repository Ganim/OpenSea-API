import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Get HR Manufacturer by ID (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should get manufacturer by id', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/hr/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `Get Mfg ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
        email: `getmfg${timestamp}@example.com`,
      });

    const manufacturerId = createResponse.body.id;

    const response = await request(app.server)
      .get(`/v1/hr/manufacturers/${manufacturerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id', manufacturerId);
    expect(response.body).toHaveProperty('legalName');
    expect(response.body).toHaveProperty('type', 'MANUFACTURER');
  });

  it('should return 404 for non-existent manufacturer', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .get('/v1/hr/manufacturers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).get(
      '/v1/hr/manufacturers/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
