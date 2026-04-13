import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Update Bid (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .put('/v1/bids/00000000-0000-0000-0000-000000000001')
      .send({ object: 'Updated object' });

    expect(response.status).toBe(401);
  });

  it('should update a bid (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const createRes = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Objeto original ${ts}`,
        organName: `Orgao ${ts}`,
        openingDate: new Date().toISOString(),
      });

    const bidId = createRes.body.bid.id;

    const response = await request(app.server)
      .put(`/v1/bids/${bidId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        object: `Objeto atualizado ${ts}`,
        viabilityScore: 85,
        tags: ['urgente', 'prioritario'],
      });

    expect(response.status).toBe(200);
    expect(response.body.bid).toBeDefined();
    expect(response.body.bid.id).toBe(bidId);
  });
});
