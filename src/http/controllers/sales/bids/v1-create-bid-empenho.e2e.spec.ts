import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Bid Empenho (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/bid-empenhos')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should create a bid empenho (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create customer
    const customerRes = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Empenho Customer ${ts}`,
        type: 'BUSINESS',
        email: `empenho-cust-${ts}@example.com`,
      });

    const customerId = customerRes.body.customer.id;

    // Create a bid
    const bidRes = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-EMP-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Objeto empenho ${ts}`,
        organName: `Orgao ${ts}`,
        openingDate: new Date().toISOString(),
      });

    const bidId = bidRes.body.bid.id;

    // Create a contract
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const contractRes = await request(app.server)
      .post('/v1/bid-contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bidId,
        contractNumber: `CT-EMP-${ts}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalValue: 200000,
        customerId,
      });

    const contractId = contractRes.body.contract.id;

    const response = await request(app.server)
      .post('/v1/bid-empenhos')
      .set('Authorization', `Bearer ${token}`)
      .send({
        contractId,
        empenhoNumber: `NE-${ts}`,
        type: 'ORDINARIO',
        value: 50000,
        issueDate: new Date().toISOString(),
        notes: 'Nota de empenho para testes',
      });

    expect(response.status).toBe(201);
    expect(response.body.empenho).toBeDefined();
    expect(response.body.empenho.id).toBeDefined();
    expect(response.body.empenho.contractId).toBe(contractId);
    expect(response.body.empenho.type).toBe('ORDINARIO');
  });
});
