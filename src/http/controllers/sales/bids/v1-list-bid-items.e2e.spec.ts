import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('List Bid Items (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server).get(
      '/v1/bids/00000000-0000-0000-0000-000000000001/items',
    );

    expect(response.status).toBe(401);
  });

  it('should list bid items (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a bid to have a valid bidId
    const createRes = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-ITEMS-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Objeto com itens ${ts}`,
        organName: `Orgao ${ts}`,
        openingDate: new Date().toISOString(),
      });

    const bidId = createRes.body.bid.id;

    const response = await request(app.server)
      .get(`/v1/bids/${bidId}/items`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.items).toBeDefined();
    expect(Array.isArray(response.body.items)).toBe(true);
    expect(response.body.meta).toBeDefined();
  });
});
