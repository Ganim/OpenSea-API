import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Proposals (E2E)', () => {
  let tenantId: string;
  let token: string;
  let customerId: string;

  beforeAll(async () => {
    await app.ready();
    const { tenantId: tid } = await createAndSetupTenant();
    tenantId = tid;
    const auth = await createAndAuthenticateUser(app, { tenantId });
    token = auth.token;

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: `Proposal Test Customer ${Date.now()}`,
        type: 'BUSINESS',
        isActive: true,
        source: 'MANUAL',
      },
    });
    customerId = customer.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/sales/proposals should create a proposal (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/proposals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: `Proposal ${timestamp}`,
        description: 'Test proposal description',
        items: [
          {
            description: 'Consulting service',
            quantity: 10,
            unitPrice: 200,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('proposal');
    expect(response.body.proposal).toHaveProperty('id');
    expect(response.body.proposal.title).toBe(`Proposal ${timestamp}`);
  });

  it('GET /v1/sales/proposals should list proposals (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/proposals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('proposals');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.proposals)).toBe(true);
  });

  it('GET /v1/sales/proposals/:id should get proposal by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/proposals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: `Proposal GetById ${Date.now()}`,
        items: [
          {
            description: 'Service item',
            quantity: 1,
            unitPrice: 500,
          },
        ],
      });

    const proposalId = createResponse.body.proposal.id;

    const response = await request(app.server)
      .get(`/v1/sales/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('proposal');
    expect(response.body.proposal.id).toBe(proposalId);
  });

  it('DELETE /v1/sales/proposals/:id should soft delete a proposal (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/proposals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: `Proposal Delete ${Date.now()}`,
        items: [
          {
            description: 'Item to delete',
            quantity: 1,
            unitPrice: 100,
          },
        ],
      });

    const proposalId = createResponse.body.proposal.id;

    const response = await request(app.server)
      .delete(`/v1/sales/proposals/${proposalId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
