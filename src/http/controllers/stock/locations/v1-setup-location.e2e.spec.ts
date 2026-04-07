import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Setup Location (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should create a warehouse with zones and bins atomically', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();
    const suffix = String(timestamp).slice(-4);

    const response = await request(app.server)
      .post('/v1/locations/setup')
      .set('Authorization', `Bearer ${token}`)
      .send({
        warehouse: {
          code: `S${suffix.slice(-3)}`,
          name: `Setup Warehouse ${timestamp}`,
          description: 'Atomic setup test',
        },
        zones: [
          {
            code: `Z${suffix.slice(-3)}`,
            name: `Zone A ${timestamp}`,
            structure: {
              aisleConfigs: [{ shelvesPerAisle: 2, binsPerShelf: 3 }],
            },
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('warehouse');
    expect(response.body).toHaveProperty('zones');
    expect(response.body).toHaveProperty('totalBinsCreated');
    expect(response.body.warehouse.code).toBe(`S${suffix.slice(-3)}`);
    expect(response.body.warehouse.name).toBe(`Setup Warehouse ${timestamp}`);
    expect(response.body.warehouse.id).toBeDefined();
    expect(response.body.zones).toHaveLength(1);
    expect(response.body.zones[0].code).toBe(`Z${suffix.slice(-3)}`);
    expect(response.body.totalBinsCreated).toBeGreaterThan(0);
  });

  it('should create multiple zones at once', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now();
    const suffix = String(timestamp).slice(-4);

    const response = await request(app.server)
      .post('/v1/locations/setup')
      .set('Authorization', `Bearer ${token}`)
      .send({
        warehouse: {
          code: `M${suffix.slice(-3)}`,
          name: `Multi-Zone Warehouse ${timestamp}`,
        },
        zones: [
          {
            code: `A${suffix.slice(-2)}`,
            name: `Zone Alpha ${timestamp}`,
          },
          {
            code: `B${suffix.slice(-2)}`,
            name: `Zone Beta ${timestamp}`,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.zones).toHaveLength(2);
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/locations/setup')
      .send({
        warehouse: { code: 'TST', name: 'No Auth' },
        zones: [{ code: 'ZZ', name: 'Zone' }],
      });

    expect(response.status).toBe(401);
  });
});
