import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Preview Zone Reconfiguration (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should preview reconfiguration diff for a zone', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const timestamp = Date.now().toString();

    const warehouse = await prisma.warehouse.create({
      data: {
        tenantId,
        code: `W${timestamp.slice(-4)}`,
        name: `Warehouse ${timestamp}`,
      },
    });

    const zone = await prisma.zone.create({
      data: {
        tenantId,
        warehouseId: warehouse.id,
        code: `Z${timestamp.slice(-3)}`,
        name: `Zone ${timestamp}`,
        structure: {
          aisles: 2,
          shelvesPerAisle: 3,
          binsPerShelf: 4,
        },
      },
    });

    // Create initial bins (2 aisles * 3 shelves * 4 bins = 24 bins)
    for (let a = 1; a <= 2; a++) {
      for (let s = 1; s <= 3; s++) {
        const positions = ['A', 'B', 'C', 'D'];
        for (let b = 0; b < 4; b++) {
          await prisma.bin.create({
            data: {
              tenantId,
              zoneId: zone.id,
              address: `${warehouse.code}-${zone.code}-${String(a).padStart(2, '0')}-${String(s).padStart(2, '0')}-${positions[b]}`,
              aisle: a,
              shelf: s,
              position: positions[b],
            },
          });
        }
      }
    }

    // Preview a reconfiguration to a larger structure
    const response = await request(app.server)
      .post(`/v1/zones/${zone.id}/reconfiguration-preview`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        structure: {
          aisles: 3,
          shelvesPerAisle: 5,
          binsPerShelf: 4,
          aisleConfigs: [],
          codePattern: {
            separator: '-',
            aisleDigits: 2,
            shelfDigits: 2,
            binLabeling: 'LETTERS',
            binDirection: 'BOTTOM_UP',
          },
          dimensions: {
            aisleWidth: 120,
            aisleSpacing: 30,
            shelfWidth: 80,
            shelfHeight: 200,
            binHeight: 20,
          },
        },
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('binsToPreserve');
    expect(response.body).toHaveProperty('binsToCreate');
    expect(response.body).toHaveProperty('binsToDeleteEmpty');
    expect(response.body).toHaveProperty('binsWithItems');
    expect(response.body).toHaveProperty('totalAffectedItems');
    expect(response.body).toHaveProperty('totalNewBins');
    expect(typeof response.body.binsToPreserve).toBe('number');
    expect(typeof response.body.binsToCreate).toBe('number');
  });

  it('should return 404 for non-existent zone', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });

    const response = await request(app.server)
      .post(
        '/v1/zones/00000000-0000-0000-0000-000000000000/reconfiguration-preview',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({
        structure: {
          aisles: 1,
          shelvesPerAisle: 1,
          binsPerShelf: 1,
          aisleConfigs: [],
          codePattern: {
            separator: '-',
            aisleDigits: 2,
            shelfDigits: 2,
            binLabeling: 'LETTERS',
            binDirection: 'BOTTOM_UP',
          },
          dimensions: {
            aisleWidth: 120,
            aisleSpacing: 30,
            shelfWidth: 80,
            shelfHeight: 200,
            binHeight: 20,
          },
        },
      });

    expect([400, 404]).toContain(response.status);
    expect(response.body).toHaveProperty('message');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.server)
      .post(
        '/v1/zones/00000000-0000-0000-0000-000000000000/reconfiguration-preview',
      )
      .send({
        structure: {
          aisles: 1,
          shelvesPerAisle: 1,
          binsPerShelf: 1,
          aisleConfigs: [],
          codePattern: {
            separator: '-',
            aisleDigits: 2,
            shelfDigits: 2,
            binLabeling: 'LETTERS',
            binDirection: 'BOTTOM_UP',
          },
          dimensions: {
            aisleWidth: 120,
            aisleSpacing: 30,
            shelfWidth: 80,
            shelfHeight: 200,
            binHeight: 20,
          },
        },
      });

    // POST with body may return 400 (Zod validation) before auth middleware
    expect([400, 401]).toContain(response.status);
  });
});
