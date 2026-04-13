import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Change Bid Status (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .patch('/v1/bids/00000000-0000-0000-0000-000000000001/status')
      .send({ status: 'ANALYZING' });

    expect(response.status).toBe(401);
  });

  it('should change bid status (200)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const createRes = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-STATUS-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Objeto status test ${ts}`,
        organName: `Orgao ${ts}`,
        openingDate: new Date().toISOString(),
      });

    const bidId = createRes.body.bid.id;

    const response = await request(app.server)
      .patch(`/v1/bids/${bidId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'ANALYZING',
        reason: 'Iniciando analise do edital',
      });

    expect(response.status).toBe(200);
    expect(response.body.bid).toBeDefined();
    expect(response.body.bid.status).toBe('ANALYZING');
  });
});
