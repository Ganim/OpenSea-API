import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Bid (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/bids')
      .send({ portalName: 'ComprasGov' });

    expect(response.status).toBe(401);
  });

  it('should create a bid (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    const response = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Aquisicao de material de escritorio ${ts}`,
        organName: `Orgao Federal ${ts}`,
        openingDate: new Date().toISOString(),
      });

    expect(response.status).toBe(201);
    expect(response.body.bid).toBeDefined();
    expect(response.body.bid.id).toBeDefined();
    expect(response.body.bid.portalName).toContain('ComprasGov');
    expect(response.body.bid.modality).toBe('PREGAO_ELETRONICO');
    expect(response.body.bid.status).toBeDefined();
  });
});
