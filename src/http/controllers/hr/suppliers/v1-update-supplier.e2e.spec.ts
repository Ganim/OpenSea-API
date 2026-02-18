import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update HR Supplier (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update hr supplier', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    // Create supplier first
    const createResponse = await request(app.server)
      .post('/v1/hr/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `Supplier ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
        email: `supplier${timestamp}@example.com`,
        phoneMain: '11987654321',
      });

    expect(createResponse.status).toBe(201);
    const supplierId = createResponse.body.id;

    // Update supplier
    const response = await request(app.server)
      .patch(`/v1/hr/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `Updated Supplier ${timestamp}`,
        tradeName: 'Updated Trade Name',
      });

    expect(response.status).toBe(200);
    expect(response.body.legalName).toBe(`Updated Supplier ${timestamp}`);
    expect(response.body.tradeName).toBe('Updated Trade Name');
  });

  it('should return 404 for non-existent supplier', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .patch('/v1/hr/suppliers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: 'Non Existent',
      });

    expect(response.status).toBe(404);
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .patch('/v1/hr/suppliers/00000000-0000-0000-0000-000000000000')
      .send({
        legalName: 'Unauthorized',
      });

    expect(response.status).toBe(401);
  });
});
