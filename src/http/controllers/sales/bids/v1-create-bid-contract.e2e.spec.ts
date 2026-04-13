import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Create Bid Contract (E2E)', () => {
  let tenantId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
  });

  it('should return 401 without token', async () => {
    const response = await request(app.server)
      .post('/v1/bid-contracts')
      .send({});

    expect(response.status).toBe(401);
  });

  it('should create a bid contract (201)', async () => {
    const { token } = await createAndAuthenticateUser(app, { tenantId });
    const ts = Date.now();

    // Create a customer
    const customerRes = await request(app.server)
      .post('/v1/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: `Contract Customer ${ts}`,
        type: 'BUSINESS',
        email: `contract-cust-${ts}@example.com`,
      });

    const customerId = customerRes.body.customer.id;

    // Create a bid
    const bidRes = await request(app.server)
      .post('/v1/bids')
      .set('Authorization', `Bearer ${token}`)
      .send({
        portalName: `ComprasGov-${ts}`,
        editalNumber: `EDITAL-CONTRACT-${ts}`,
        modality: 'PREGAO_ELETRONICO',
        criterionType: 'MENOR_PRECO',
        legalFramework: 'LEI_14133_2021',
        object: `Objeto contrato ${ts}`,
        organName: `Orgao ${ts}`,
        openingDate: new Date().toISOString(),
      });

    const bidId = bidRes.body.bid.id;

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const response = await request(app.server)
      .post('/v1/bid-contracts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        bidId,
        contractNumber: `CT-${ts}`,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalValue: 150000,
        customerId,
      });

    expect(response.status).toBe(201);
    expect(response.body.contract).toBeDefined();
    expect(response.body.contract.id).toBeDefined();
    expect(response.body.contract.bidId).toBe(bidId);
    expect(response.body.contract.contractNumber).toContain('CT-');
  });
});
