import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';

describe('Delete HR Supplier (E2E)', () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should delete hr supplier with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app);
    const timestamp = Date.now();

    // Create supplier via API first
    const createResponse = await request(app.server)
      .post('/v1/hr/suppliers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `Supplier to Delete ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
      });

    const supplierId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/v1/hr/suppliers/${supplierId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should not delete hr supplier without auth token', async () => {
    const response = await request(app.server).delete(
      '/v1/hr/suppliers/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
