import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Delete HR Manufacturer (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should soft delete a manufacturer', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const createResponse = await request(app.server)
      .post('/v1/hr/manufacturers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        legalName: `Delete Mfg ${timestamp}`,
        cnpj: `${String(timestamp).slice(-14).padStart(14, '0')}`,
        email: `delmfg${timestamp}@example.com`,
      });

    const manufacturerId = createResponse.body.id;

    const response = await request(app.server)
      .delete(`/v1/hr/manufacturers/${manufacturerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });

  it('should return 404 for non-existent manufacturer', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .delete('/v1/hr/manufacturers/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server).delete(
      '/v1/hr/manufacturers/00000000-0000-0000-0000-000000000000',
    );

    expect(response.status).toBe(401);
  });
});
