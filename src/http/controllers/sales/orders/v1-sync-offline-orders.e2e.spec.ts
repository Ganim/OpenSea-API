import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';
import { randomUUID } from 'node:crypto';

describe('Sync Offline Orders (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/orders/sync-offline')
      .send({
        orders: [
          {
            items: [{ variantId: randomUUID(), quantity: 1 }],
          },
        ],
      });

    expect(response.status).toBe(401);
  });

  it('should attempt to sync offline orders', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post('/v1/orders/sync-offline')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orders: [
          {
            offlineRef: `OFF-${Date.now()}`,
            items: [{ variantId: randomUUID(), quantity: 1 }],
          },
        ],
      });

    // May return 200 with synced/failed arrays, or 400 if variants not found
    expect([200, 400]).toContain(response.status);
    if (response.status === 200) {
      expect(response.body.synced).toBeDefined();
      expect(response.body.failed).toBeDefined();
    }
  });
});
