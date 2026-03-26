import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { app } from '@/app';
import { prisma } from '@/lib/prisma';
import { createAndAuthenticateUser } from '@/utils/tests/factories/core/create-and-authenticate-user.e2e';
import { createAndSetupTenant } from '@/utils/tests/factories/core/create-and-setup-tenant.e2e';

describe('Quotes (E2E)', () => {
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
        name: `Quote Test Customer ${Date.now()}`,
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

  it('POST /v1/sales/quotes should create a quote (201)', async () => {
    const timestamp = Date.now();

    const response = await request(app.server)
      .post('/v1/sales/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: `Quote ${timestamp}`,
        items: [
          {
            productName: 'Test Product',
            quantity: 2,
            unitPrice: 100,
          },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('quote');
    expect(response.body.quote).toHaveProperty('id');
    expect(response.body.quote.title).toBe(`Quote ${timestamp}`);
  });

  it('GET /v1/sales/quotes should list quotes (200)', async () => {
    const response = await request(app.server)
      .get('/v1/sales/quotes')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('quotes');
    expect(response.body).toHaveProperty('meta');
    expect(Array.isArray(response.body.quotes)).toBe(true);
  });

  it('GET /v1/sales/quotes/:id should get quote by id (200)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: `Quote GetById ${Date.now()}`,
        items: [
          {
            productName: 'Product A',
            quantity: 1,
            unitPrice: 50,
          },
        ],
      });

    const quoteId = createResponse.body.quote.id;

    const response = await request(app.server)
      .get(`/v1/sales/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('quote');
    expect(response.body.quote.id).toBe(quoteId);
  });

  it('DELETE /v1/sales/quotes/:id should soft delete a quote (204)', async () => {
    const createResponse = await request(app.server)
      .post('/v1/sales/quotes')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId,
        title: `Quote Delete ${Date.now()}`,
        items: [
          {
            productName: 'Product B',
            quantity: 1,
            unitPrice: 75,
          },
        ],
      });

    const quoteId = createResponse.body.quote.id;

    const response = await request(app.server)
      .delete(`/v1/sales/quotes/${quoteId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(204);
  });
});
