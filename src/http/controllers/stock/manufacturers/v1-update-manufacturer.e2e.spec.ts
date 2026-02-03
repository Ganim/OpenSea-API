import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { createManufacturer } from '@/utils/tests/factories/stock/create-manufacturer.e2e';

describe('Update Manufacturer (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should update manufacturer with correct schema', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();

    const { manufacturer } = await createManufacturer({
      tenantId,
      name: `Original Manufacturer ${timestamp}`,
    });

    const response = await request(app.server)
      .put(`/v1/manufacturers/${manufacturer.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Updated Manufacturer ${timestamp}`,
        country: 'Canada',
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('manufacturer');
    expect(response.body.manufacturer).toHaveProperty('id', manufacturer.id);
    expect(response.body.manufacturer).toHaveProperty(
      'name',
      `Updated Manufacturer ${timestamp}`,
    );
  });
});
