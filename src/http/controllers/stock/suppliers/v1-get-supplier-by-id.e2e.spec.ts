import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Get Supplier By ID (E2E)', () => {
  let managerToken: string;

  beforeAll(async () => {
    await app.ready();

    const { token } = await createAndAuthenticateUser(app);
    managerToken = token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be able to get a supplier by id', async () => {
    // Create a supplier first
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/suppliers')
      .set('Authorization', `Bearer ${managerToken}`)
      .send({
        name: `Test Supplier ${timestamp}`,
        taxId: 'TAX-GET-001',
        contact: 'Jane Smith',
        email: `getsupplier${timestamp}@example.com`,
        phone: '(21) 91234-5678',
        address: '456 Oak Avenue',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brazil',
        rating: 4,
        isActive: true,
      });

    const supplierId = createResponse.body.supplier.id;

    // Get the supplier
    const response = await request(app.server)
      .get(`/v1/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      supplier: {
        id: supplierId,
        name: `Test Supplier ${timestamp}`,
        taxId: 'TAX-GET-001',
        contact: 'Jane Smith',
        email: `getsupplier${timestamp}@example.com`,
        phone: '(21) 91234-5678',
        address: '456 Oak Avenue',
        city: 'Rio de Janeiro',
        state: 'RJ',
        country: 'Brazil',
        rating: 4,
        isActive: true,
        createdAt: expect.any(String),
      },
    });
  });

  it('should not be able to get a non-existent supplier', async () => {
    const response = await request(app.server)
      .get('/v1/suppliers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${managerToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Supplier not found');
  });
});
